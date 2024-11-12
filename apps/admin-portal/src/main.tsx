import "@peerprep/ui/tailwind/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import ErrorPage from "~/error";
import AuthProtectedLayout from "~/layouts/auth-protected";
import PublicNotAuthLayout from "~/layouts/public-not-auth";
import QuestionLayout from "~/layouts/question";
import RootLayout from "~/layouts/root";
import IndexPage from "~/routes/index";
import LoginPage from "~/routes/login";
import QuestionPage from "~/routes/question-content";
import QuestionEditPage from "~/routes/question-edit";
import QuestionsPage from "~/routes/questions";
import RegisterPage from "~/routes/register";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const router = createBrowserRouter(
  [
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
          children: [
            { index: true, element: <IndexPage /> },
            { path: "/questions", element: <QuestionsPage /> },
            {
              path: "/questions/:id",
              element: <QuestionLayout />,
              children: [
                { index: true, element: <QuestionPage /> },
                { path: "edit", element: <QuestionEditPage /> },
              ],
            },
          ],
        },
      ],
    },
  ],
  { basename: "/admin" },
);

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
