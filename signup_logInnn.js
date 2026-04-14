// Shared Firebase setup and authentication helpers for sign up, login, and role selection.
const firebaseConfig = {
    apiKey: "AIzaSyDyIr2fg2uUtJPeHmvTJhePkt6DWti12Vw",
    authDomain: "page-not-found-a7dcb.firebaseapp.com",
    projectId: "page-not-found-a7dcb",
    storageBucket: "page-not-found-a7dcb.firebasestorage.app",
    messagingSenderId: "59141562173",
    appId: "1:59141562173:web:a724b5c22145e2b974ef54"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

function getHomepageForRole(role) {
    return role === "recruiter" ? "recruiter_homepage.html" : "applicant_homepage.html";
}

function getCurrentPageName() {
    const pathname = window.location.pathname || "";
    const parts = pathname.split("/");
    return parts[parts.length - 1] || "";
}

async function ensureUserDocument(user, fullName = "") {
    if (!user) {
        return {};
    }

    const payload = {
        email: user.email || ""
    };
    const resolvedFullName = fullName || user.displayName || "";

    if (resolvedFullName) {
        payload.fullName = resolvedFullName;
    }

    await db.collection("users").doc(user.uid).set(payload, { merge: true });
    const snapshot = await db.collection("users").doc(user.uid).get();

    return snapshot.exists ? snapshot.data() : payload;
}

async function redirectUserByRole(user) {
    try {
        const userData = await ensureUserDocument(user);

        if (!userData.role) {
            window.location.href = "chooseRoles.html";
            return;
        }

        window.location.href = getHomepageForRole(userData.role);
    } catch (error) {
        console.error("Failed to load user role:", error);
        alert("Failed to load your account details. Please try again.");
    }
}

async function googleLogin() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        await ensureUserDocument(result.user);
        await redirectUserByRole(result.user);
    } catch (error) {
        alert("Google Error: " + error.message);
    }
}

async function signUpUser(fullName, email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);

        if (fullName) {
            await userCredential.user.updateProfile({ displayName: fullName });
        }

        await ensureUserDocument(userCredential.user, fullName);
        alert("Account created successfully.");
        window.location.href = "chooseRoles.html";
    } catch (error) {
        alert(error.message);
    }
}

async function logInUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await redirectUserByRole(userCredential.user);
    } catch (error) {
        alert(error.message);
    }
}

function forgotPassword(email) {
    if (!email) {
        alert("Please enter your email first.");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("If an account exists, a reset email has been sent.");
        })
        .catch((error) => {
            console.error(error);

            if (error.code === "auth/user-not-found") {
                alert("No account found with this email.");
                return;
            }

            if (error.code === "auth/invalid-email") {
                alert("Invalid email address.");
                return;
            }

            alert(error.message);
        });
}

async function handleSignupSubmit(event) {
    event.preventDefault();

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const fullName = fullNameInput ? fullNameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

    if (!fullName) {
        alert("Please enter your full name.");
        fullNameInput?.focus();
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        confirmPasswordInput?.focus();
        return;
    }

    await signUpUser(fullName, email, password);
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    await logInUser(email, password);
}

function bindGoogleButtons() {
    const googleButtons = document.querySelectorAll(".google-btn, .option a");

    googleButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            googleLogin();
        });
    });
}

function bindForgotPassword() {
    const forgotPasswordLink = document.getElementById("forgotPassword");

    if (!forgotPasswordLink) {
        return;
    }

    forgotPasswordLink.addEventListener("click", (event) => {
        event.preventDefault();
        const emailInput = document.getElementById("email");
        forgotPassword(emailInput ? emailInput.value.trim() : "");
    });
}

function bindPasswordToggle() {
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");

    if (!togglePassword || !passwordInput) {
        return;
    }

    togglePassword.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        togglePassword.textContent = isPassword ? "Hide" : "Show";
    });
}

function bindAuthForms() {
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.querySelector(".login_form form");

    if (signupForm) {
        signupForm.addEventListener("submit", handleSignupSubmit);
    }

    if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);
    }

    bindGoogleButtons();
    bindForgotPassword();
    bindPasswordToggle();
}

function handleAuthPageRedirect() {
    const currentPage = getCurrentPageName();

    if (currentPage !== "signUp.html" && currentPage !== "logIn.html") {
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            return;
        }

        await redirectUserByRole(user);
    });
}

window.authHelpers = {
    auth,
    db,
    ensureUserDocument,
    getHomepageForRole,
    redirectUserByRole
};

document.addEventListener("DOMContentLoaded", () => {
    bindAuthForms();
    handleAuthPageRedirect();
});
