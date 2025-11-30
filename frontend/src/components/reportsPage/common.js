export const getStatusVariant = (status) => {
    switch (status) {
        case "pending":
            return "warning";
        case "assigned":
            return "primary";
        case "in_progress":
            return "success";
        case "rejected":
            return "danger";
        case "suspended":
            return "secondary";
        default:
            return "secondary";
    }
};