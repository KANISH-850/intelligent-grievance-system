"""
Civic Infrastructure Computer Vision Model Training Pipeline
Fine-tunes MobileNetV3-Small via transfer learning on genuine real-world civic photographs.
Saves checkpoints, tracks loss curves, tracks validation metrics, and produces a complete training manifest.
"""
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_cv_model")

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "datasets" / "civic_real_world"
SPLITS_DIR = DATASET_DIR / "splits"
MODELS_DIR = BASE_DIR / "models"


def get_data_loaders(batch_size: int = 16, num_workers: int = 0) -> Tuple[DataLoader, DataLoader, DataLoader, List[str]]:
    """Build PyTorch DataLoaders with realistic civic augmentation."""
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_test_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    train_dataset = datasets.ImageFolder(SPLITS_DIR / "train", transform=train_transforms)
    val_dataset = datasets.ImageFolder(SPLITS_DIR / "val", transform=val_test_transforms)
    test_dataset = datasets.ImageFolder(SPLITS_DIR / "test", transform=val_test_transforms)

    class_names = train_dataset.classes

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    return train_loader, val_loader, test_loader, class_names


def build_model(num_classes: int) -> nn.Module:
    """Instantiate MobileNetV3-Small with custom civic classifier head."""
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)

    # Freeze earlier convolutional layers, allow top layers to adapt
    for param in model.features[:8].parameters():
        param.requires_grad = False

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes),
    )
    return model


def train_one_epoch(model: nn.Module, loader: DataLoader, criterion: nn.Module, optimizer: optim.Optimizer, device: torch.device) -> Tuple[float, float]:
    """Train for a single epoch."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for inputs, labels in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels.data).item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc


def evaluate(model: nn.Module, loader: DataLoader, criterion: nn.Module, device: torch.device) -> Tuple[float, float]:
    """Evaluate loss and accuracy on validation or test split."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

    eval_loss = running_loss / total
    eval_acc = correct / total
    return eval_loss, eval_acc


def main():
    logger.info("Initializing Civic CV Model Training...")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training on device: {device}")

    train_loader, val_loader, test_loader, class_names = get_data_loaders(batch_size=16)
    logger.info(f"Categories ({len(class_names)}): {class_names}")
    logger.info(f"Split sizes: Train={len(train_loader.dataset)}, Val={len(val_loader.dataset)}, Test={len(test_loader.dataset)}")

    model = build_model(num_classes=len(class_names)).to(device)
    criterion = nn.CrossEntropyLoss()

    # Differential learning rate
    optimizer = optim.AdamW([
        {"params": model.features[8:].parameters(), "lr": 2e-4},
        {"params": model.classifier.parameters(), "lr": 1e-3},
    ], weight_decay=1e-4)

    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)

    num_epochs = 12
    best_val_acc = 0.0
    history: List[Dict] = []
    start_time = time.time()

    best_checkpoint_path = MODELS_DIR / "civic_mobilenet_v3_best.pth"
    final_checkpoint_path = MODELS_DIR / "civic_mobilenet_v3.pth"

    for epoch in range(1, num_epochs + 1):
        epoch_start = time.time()
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        scheduler.step(val_loss)
        epoch_dur = time.time() - epoch_start

        logger.info(
            f"Epoch {epoch:02d}/{num_epochs:02d} [{epoch_dur:.1f}s] - "
            f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}"
        )

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 4),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 4),
            "duration_seconds": round(epoch_dur, 2),
        })

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "class_names": class_names,
                "val_acc": val_acc,
                "architecture": "MobileNetV3-Small",
            }, best_checkpoint_path)
            logger.info(f" Saved new best model checkpoint (Val Acc: {val_acc:.4f})")

    total_duration = time.time() - start_time
    logger.info(f"Training finished in {total_duration:.1f}s. Best Val Acc: {best_val_acc:.4f}")

    # Save final model
    torch.save({
        "epoch": num_epochs,
        "model_state_dict": model.state_dict(),
        "class_names": class_names,
        "best_val_acc": best_val_acc,
        "architecture": "MobileNetV3-Small",
    }, final_checkpoint_path)

    # Save training summary
    summary = {
        "architecture": "MobileNetV3-Small (Transfer Learning)",
        "pretrained_weights": "ImageNet1K_V1",
        "device": str(device),
        "num_classes": len(class_names),
        "class_names": class_names,
        "train_samples": len(train_loader.dataset),
        "val_samples": len(val_loader.dataset),
        "test_samples": len(test_loader.dataset),
        "num_epochs": num_epochs,
        "batch_size": 16,
        "optimizer": "AdamW",
        "total_training_duration_seconds": round(total_duration, 2),
        "best_val_acc": round(best_val_acc, 4),
        "epoch_history": history,
    }

    with open(MODELS_DIR / "training_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info("Training summary successfully saved to models/training_summary.json")


if __name__ == "__main__":
    main()
