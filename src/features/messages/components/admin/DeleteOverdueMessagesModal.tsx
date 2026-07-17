import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DICTIONARY } from "@/constants/dictionary";

type DeleteOverdueMessagesModalProps = {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const ICON_SIZE = 16;

/**
 * Presents confirmation controls for the overdue resolved-message deletion.
 */
export const DeleteOverdueMessagesModal = ({
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteOverdueMessagesModalProps) => {
  const d = DICTIONARY.admin.messages.bulkDelete;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      title={d.modalTitle}
      className="max-w-md"
      bodyClassName="p-4"
    >
      <p className="text-sm leading-relaxed text-text-secondary">
        {d.description}
      </p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDeleting}
          onClick={onClose}
        >
          {DICTIONARY.global.ui.cancel}
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting && (
            <Loader2
              size={ICON_SIZE}
              className="animate-spin"
              aria-hidden="true"
            />
          )}
          {isDeleting ? d.deleting : d.confirm}
        </Button>
      </div>
    </Modal>
  );
};
