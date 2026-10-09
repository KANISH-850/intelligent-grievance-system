# Technical Glossary & Concepts Reference

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  

---

## Technical Definitions (Alphabetical Order)

### 1. Artificial Intelligence (AI)
The broader field of computer science focused on building systems capable of performing tasks that typically require human intelligence. In this project, AI encompasses natural language processing, automated text classification, priority estimation, and intent-based chatbot assistance.

### 2. Application Programming Interface (API)
A set of defined rules and protocols allowing different software applications to communicate with each other. In this project, HTTP REST APIs connect the React frontend, Express API Gateway, and FastAPI AI microservice.

### 3. Asynchronous I/O
A non-blocking execution model allowing a server to handle other incoming tasks while waiting for I/O operations (such as database queries or HTTP network calls) to complete. Node.js Express uses asynchronous event loop handling for high throughput.

### 4. Authentication
The process of verifying the identity of a user attempting to log into a system. Implemented in this project using email/password validation against bcrypt hashes and issuing 24-hour JSON Web Tokens (JWT).

### 5. Authorization
The process of determining whether an authenticated user has permission to access specific resources or execute actions. Implemented using Role-Based Access Control (RBAC) middleware for `CITIZEN`, `OFFICER`, and `ADMIN` roles.

### 6. Bcrypt
A password-hashing function designed to securely hash user passwords using random salts and a configurable work factor (cost factor 10 in this project). Bcrypt prevents rainbow table attacks and protects stored credentials in PostgreSQL.

### 7. Classification
A supervised machine learning task where an algorithm predicts a discrete categorical label for an input data instance. In this project, text classification assigns citizen complaints to one of 9 government domains.

### 8. Confidence Score
A numerical probability (ranging from 0.0 to 1.0) indicating how certain a machine learning model is regarding its prediction. In our system, confidence scores below 0.75 automatically trigger human administrator review.

### 9. Cross-Origin Resource Sharing (CORS)
A security feature implemented by web browsers that restricts web pages from making API requests to a domain different from the one that served the web page. Configured in Express to allow requests from the React client URL (`http://localhost:5173`).

### 10. Docker & Docker Compose
Docker is a containerization platform that packages applications and dependencies into isolated containers. Docker Compose orchestrates multi-container applications, managing startup dependencies across PostgreSQL, FastAPI, Express, and Nginx.

### 11. Explainable AI (XAI)
Techniques in machine learning that make the outputs and internal reasoning of AI models understandable to humans. In this project, XAI token contribution scores ($S = \text{TF-IDF} \times w$) highlight specific complaint keywords that influenced the assigned category.

### 12. Express.js
A minimal, flexible Node.js web application framework providing routing, middleware support, and HTTP utility methods. Serves as the central API Gateway in this system.

### 13. F1-Score
The harmonic mean of Precision and Recall ($F_1 = 2 \cdot \frac{P \cdot R}{P + R}$), providing a single balanced metric for evaluating classifier performance.

### 14. FastAPI
A modern, high-performance Python web framework for building APIs with automatic Pydantic schema validation and OpenAPI documentation. Powers the Python machine learning microservice on port 8001.

### 15. Feature Vectorization
The process of converting raw unstructured text into numerical feature vectors that machine learning algorithms can process. Implemented using `TfidfVectorizer` to produce 5,000-dimensional TF-IDF vectors.

### 16. Foreign Key
A column or group of columns in a relational database table that provides a link between data in two tables, enforcing referential integrity. In PostgreSQL via Prisma, `user_id` in `Grievance` acts as a foreign key referencing `User.id`.

### 17. Human-in-the-Loop (HITL)
An architectural pattern where human intervention is combined with automated machine learning workflows. Low-confidence predictions ($<0.75$) are routed to human administrators for classification review and manual correction.

### 18. Hyperparameter
A configuration parameter whose value is set before machine learning model training begins, controlling learning behavior. Examples in our code include `ngram_range=(1,2)` and Logistic Regression inverse regularization `C=2.5`.

### 19. Inverse Document Frequency (IDF)
A measure of how much information a word provides across a collection of documents ($\text{IDF}(t) = \log(N / df_t)$). Gives higher numerical weights to rare, domain-specific words like "transformer" compared to common words like "the".

### 20. JSON Web Token (JWT)
A compact, URL-safe standard (RFC 7519) for securely transmitting information between parties as a digitally signed JSON object. Used for stateless session authentication in `Authorization: Bearer <token>` headers.

### 21. Language Detection
The task of automatically identifying the natural language of a text input. Implemented using the `langdetect` library to identify ISO-639-1 language codes (English, Hindi, Tamil, etc.).

### 22. Logistic Regression
A linear classification algorithm that models the probability of discrete outcomes using the Softmax function for multi-class prediction. Serves as the core machine learning classifier in this project.

### 23. Microservice Architecture
An architectural style that structures an application as a collection of small, autonomous, loosely coupled services communicating over network protocols. Separates the React UI, Express API Gateway, FastAPI AI Service, and PostgreSQL database.

### 24. Migration (Database)
A set of version-controlled SQL scripts that manage schema changes (adding tables, altering columns) over time without destroying existing data. Executed via `npx prisma migrate deploy`.

### 25. Middleware
Functions in a web server framework that execute sequentially during the HTTP request-response cycle. Used in Express for authentication checks (`authenticate`), role restrictions (`requireRole`), and CORS handling.

### 26. Multiclass Classification
A classification task where each input instance is categorized into exactly one of three or more target classes. Our model categorizes complaints into 9 distinct government domains.

### 27. Natural Language Processing (NLP)
A subfield of computer science and AI concerned with giving computers the ability to understand text and spoken words. Encompasses tokenization, stop-word removal, TF-IDF feature extraction, and intent classification in this system.

### 28. Node.js
An open-source, cross-platform JavaScript runtime environment executing code outside the browser. Runs the Express API Gateway on port 5000.

### 29. Object-Relational Mapping (ORM)
A technique that allows developers to query and manipulate data from a database using object-oriented code instead of raw SQL queries. Prisma ORM translates JavaScript objects into PostgreSQL queries.

### 30. Precision
The proportion of positive predictions that were actually correct ($\text{Precision} = TP / (TP + FP)$). Measures classifier exactness.

### 31. Primary Key
A unique identifier for each record in a database table. In our Prisma schema, string UUIDs (e.g. `cld1234...`) serve as primary keys for tables.

### 32. Priority Estimation
The process of analyzing complaint text to determine urgency and assign resolution deadlines (SLAs). Evaluates emergency keywords to categorize complaints as `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.

### 33. PostgreSQL
A powerful, open-source object-relational database management system known for reliability and feature robustness. Stores system users, grievances, status history, and notifications.

### 34. Recall
The proportion of actual positive instances that were correctly identified by the model ($\text{Recall} = TP / (TP + FN)$). Measures classifier completeness.

### 35. React
An open-source front-end JavaScript library for building user interfaces based on components. Powers the single-page application (SPA) user interface.

### 36. Representational State Transfer (REST)
An architectural style for designing networked applications using standard HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`) and JSON data payloads.

### 37. Role-Based Access Control (RBAC)
A security mechanism that restricts system access based on user roles (`CITIZEN`, `OFFICER`, `ADMIN`).

### 38. Softmax Function
A mathematical function that normalizes a vector of $K$ real values into a probability distribution of $K$ probabilities proportional to the exponentials of the input numbers ($\sum P = 1.0$).

### 39. Synthetic Data
Data created artificially rather than generated by actual real-world events. Our model was evaluated on 675 academic synthetic grievance samples (`is_synthetic=True`).

### 40. Term Frequency (TF)
A measure of how frequently a term appears in a document ($\text{TF}(t, d) = 1 + \log(\text{count}(t, d))$).

### 41. Term Frequency-Inverse Document Frequency (TF-IDF)
A numerical statistic intended to reflect how important a word is to a document in a collection or corpus.

### 42. TypeScript
A strict syntactical superset of JavaScript that adds static typing. Used in the React frontend to enforce strict props and state object interfaces.

### 43. Unicode
An international encoding standard by which each letter, digit, or symbol is given a unique numeric value across platforms. Enables non-ASCII regional script text processing.

### 44. Vite
A modern, ultra-fast frontend build tool and dev server for JavaScript and TypeScript web applications.

### 45. Workflow State Machine
A model of computation representing valid status transitions (`SUBMITTED` -> `UNDER_REVIEW` -> `RESOLVED`/`REJECTED`) for a grievance record.
