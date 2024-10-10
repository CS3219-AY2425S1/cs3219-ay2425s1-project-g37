import { Toaster } from "@peerprep/ui/toaster";
import { getHTTPErrorMessage } from "@peerprep/utils/client";
import toast from "react-hot-toast";
import { Outlet } from "react-router-dom";
import { SWRConfig } from "swr";

export default function RootLayout() {
  return (
    <SWRConfig value={{ onError: err => toast.error(getHTTPErrorMessage(err)) }}>
      <Outlet />
      <Toaster />
    </SWRConfig>
  );
}
