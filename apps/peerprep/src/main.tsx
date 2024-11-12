import "@peerprep/ui/tailwind/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import ErrorPage from "~/error";
import AuthProtectedCenteredLayout from "~/layouts/auth-protected-centered";
import AuthProtectedEmptyLayout from "~/layouts/auth-protected-empty";
import ProfileLayout from "~/layouts/profile";
import PublicNotAuthLayout from "~/layouts/public-not-auth";
import RootLayout from "~/layouts/root";
import HistoryPage from "~/routes/history";
import IndexPage from "~/routes/index";
import LoginPage from "~/routes/login";
import ProfileSettingsPage from "~/routes/profile-settings";
import RegisterPage from "~/routes/register";
import RoomPage from "~/routes/room";

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
        element: <AuthProtectedEmptyLayout />,
        children: [
          {
            element: <AuthProtectedCenteredLayout />,
            children: [
              { index: true, element: <IndexPage /> },
              {
                path: "/profile",
                element: <ProfileLayout />,
                children: [
                  {
                    path: "/profile/settings",
                    element: <ProfileSettingsPage />,
                    handle: { title: "Profile Settings" },
                  },
                  {
                    path: "/profile/history",
                    element: <HistoryPage />,
                    handle: { title: "Room History" },
                  },
                ],
              },
            ],
          },
          { path: "/room/:id", element: <RoomPage /> },
        ],
      },
    ],
  },
]);

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
