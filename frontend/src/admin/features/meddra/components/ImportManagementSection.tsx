import { 
  Box 
} from "@chakra-ui/react";
import { trpc } from "../../../../utils/trpc";
import { ImportHistoryTable } from "./ImportHistoryTable";
import { ImportMeddraModal } from "./ImportMeddraModal";


interface ImportManagementSectionProps {
  isOpen: boolean;
  onClose: () => void;
  history?: any[];
}

export const ImportManagementSection = ({ isOpen, onClose, history }: ImportManagementSectionProps) => {
  const utils = trpc.useContext();

  return (
    <Box mt={4}>
      {history && <ImportHistoryTable history={history} />}

      <ImportMeddraModal 
        isOpen={isOpen} 
        onClose={onClose} 
        history={history}
        onSuccess={() => {
          utils.reference.getImportHistory.invalidate();
          utils.reference.getMeddraVersions.invalidate();
        }} 
      />
    </Box>
  );
};
