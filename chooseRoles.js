// Role selection uses the shared Firebase auth helpers loaded before this script.
document.addEventListener("DOMContentLoaded", () => {
    const applicantButton = document.getElementById("applicantBtn");
    const recruiterButton = document.getElementById("recruiterBtn");
    const { auth, db, ensureUserDocument, getHomepageForRole } = window.authHelpers || {};

    if (!auth || !db || !ensureUserDocument || !getHomepageForRole) {
        console.error("Auth helpers are not available on the role selection page.");
        alert("Authentication is not ready yet. Please reload the page.");
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = "logIn.html";
            return;
        }

        try {
            const userData = await ensureUserDocument(user);

            if (userData.role) {
                window.location.href = getHomepageForRole(userData.role);
            }
        } catch (error) {
            console.error("Failed to load the selected user:", error);
        }
    });

    async function setRole(role) {
        const user = auth.currentUser;

        if (!user) {
            alert("Please log in first.");
            window.location.href = "logIn.html";
            return;
        }

        try {
            const payload = {
                email: user.email || "",
                role
            };

            if (user.displayName) {
                payload.fullName = user.displayName;
            }

            await db.collection("users").doc(user.uid).set(payload, { merge: true });

            window.location.href = getHomepageForRole(role);
        } catch (error) {
            console.error("Error saving role:", error);
            alert("Error saving role. Please try again.");
        }
    }

    applicantButton?.addEventListener("click", () => setRole("applicant"));
    recruiterButton?.addEventListener("click", () => setRole("recruiter"));
});
