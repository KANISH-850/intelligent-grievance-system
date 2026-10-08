class DepartmentRouterService:
    """
    Department Router Service.
    Component Status: IMPLEMENTED (Deterministic Category Mapping).
    """

    DEPARTMENT_MAP = {
        "Water Supply": "Water Supply",
        "Electricity": "Electricity",
        "Roads and Transport": "Roads and Transport",
        "Healthcare": "Healthcare",
        "Education": "Education",
        "Sanitation": "Sanitation",
        "Municipal Services": "Municipal Services",
        "Revenue": "Revenue",
        "Other": "Other"
    }

    def route_department(self, category: str) -> str:
        """
        Maps a classified category deterministically to its target administrative department.
        """
        return self.DEPARTMENT_MAP.get(category, "Other")

department_router_service = DepartmentRouterService()
