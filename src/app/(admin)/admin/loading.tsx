import { Loader2 } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";

const AdminLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 w-full">
      <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" aria-hidden="true" />
      <p className="text-text-secondary font-medium animate-pulse">
        {DICTIONARY.global.loading}
      </p>
    </div>
  );
};

export default AdminLoading;
