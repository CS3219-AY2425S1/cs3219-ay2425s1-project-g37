import { CircleCheckBig, CircleX, Info, LoaderCircle } from "lucide-react";
import { Toaster as OriginalToaster, ToastBar, type ToastType, toast } from "react-hot-toast";

function getToastIconColourClass(type: ToastType) {
  switch (type) {
    case "success":
      return "text-green-500";
    case "error":
      return "text-red-500";
    case "loading":
      return "text-yellow-500";
    default:
      return "text-main-500";
  }
}

function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case "success":
      return <CircleCheckBig />;
    case "error":
      return <CircleX />;
    case "loading":
      return <LoaderCircle className="animate-spin" />;
    default:
      return <Info />;
  }
}

export function Toaster() {
  return (
    <OriginalToaster position="bottom-right">
      {t => (
        <ToastBar toast={t} position="bottom-right" style={{ padding: 0, borderRadius: 0 }}>
          {({ message }) => (
            <div className="group/toast bg-main-800 text-main-300 relative flex w-96 flex-row items-center gap-3 p-6 text-sm">
              <div className={getToastIconColourClass(t.type)}>
                <ToastIcon type={t.type} />
              </div>
              <div className="line-clamp-2 flex-grow [&_*[role='status']]:m-0 [&_*[role='status']]:block">
                {message}
              </div>
              {t.type !== "loading" && (
                <button
                  className="text-main-500 hover:text-main-300 absolute right-3 top-3 text-xs opacity-0 transition group-hover/toast:opacity-100"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </OriginalToaster>
  );
}
