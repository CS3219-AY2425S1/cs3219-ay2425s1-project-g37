import "@peerprep/ui/tailwind/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import ErrorPage from "~/error";
import AuthProtectedLayout from "~/layouts/auth-protected";
import PublicNotAuthLayout from "~/layouts/public-not-auth";
import RootLayout from "~/layouts/root";
import IndexPage from "~/routes/index";
import LoginPage from "~/routes/login";
import RegisterPage from "~/routes/register";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <PublicNotAuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
        ],
      },
      {
        element: <AuthProtectedLayout />,
        children: [{ index: true, element: <IndexPage /> }],
      },
    ],
  },
]);

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
