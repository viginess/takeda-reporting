import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { trpc } from "../../../../utils/trpc";
import type { Status, Severity, Report } from "../types";

export function useReportActions() {
  const toast = useToast();
  const utils = trpc.useContext();

  const [downloadingXml, setDownloadingXml] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateMutation = trpc.admin.updateReport.useMutation({
    onSuccess: () => {
      utils.admin.getAllReports.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Report updated", status: "success", duration: 3000, isClosable: true });
    },
    onError: (err) => {
      toast({
        title: "Update failed",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  const pdfMutation = trpc.admin.getReportPDF.useMutation();
  const xmlMutation = trpc.admin.getReportXML.useMutation();
  const bulkMutation = trpc.admin.getBulkReports.useMutation();
  const regenerateMutation = trpc.admin.regenerateReportFiles.useMutation({
    onSuccess: () => {
      utils.admin.getAllReports.invalidate();
      toast({ title: "Report regenerated", status: "success", duration: 3000 });
    },
    onError: (err) => {
      toast({ title: "Regeneration failed", description: err.message, status: "error" });
    }
  });

  const handleDownloadPdf = async (report: Report) => {
    setDownloadingPdf(true);
    try {
      const res = await pdfMutation.mutateAsync({ 
        reportId: report.originalId || report.id, 
        reporterType: report.reporterType 
      });
      if (res.url) {
        const link = document.createElement('a');
        link.href = res.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      toast({ title: "PDF Generation Failed", description: err.message, status: "error" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadXml = async (report: Report) => {
    setDownloadingXml(true);
    try {
      const res = await xmlMutation.mutateAsync({ 
        reportId: report.originalId || report.id, 
        reporterType: report.reporterType 
      });
      if (res.url) {
        const link = document.createElement('a');
        link.href = res.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      toast({ title: "XML Retrieval Failed", description: err.message, status: "error" });
    } finally {
      setDownloadingXml(false);
    }
  };

  const handleBulkDownload = async (selectedReportIds: string[], reportsData: Report[], onComplete?: () => void) => {
    if (selectedReportIds.length === 0) return;
    setDownloadingBulk(true);
    try {
      const reportItems = selectedReportIds.map(id => {
        const r = reportsData.find(rep => (rep.originalId || rep.id) === id);
        return { reportId: r!.originalId || r!.id, reporterType: r!.reporterType };
      });

      const res = await bulkMutation.mutateAsync({ reports: reportItems });
      if (res.url) {
        const link = document.createElement('a');
        link.href = res.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        onComplete?.();
        toast({ title: "Bulk download complete", status: "success" });
      }
    } catch (err: any) {
      toast({ title: "Bulk download failed", description: err.message, status: "error" });
    } finally {
      setDownloadingBulk(false);
    }
  };

  const handleRegenerate = async (report: Report) => {
    await regenerateMutation.mutateAsync({
      reportId: report.originalId ?? report.id,
      reporterType: report.reporterType
    }).catch(() => {}); // handled by onError
  };

  const executeUpdate = (report: Report, editData: { status?: Status; severity?: Severity; adminNotes: string }, fullDetailsEdit: any) => {
    const statusMap: Record<Status, ("new" | "under_review" | "approved" | "closed")> = {
      "Submitted": "new",
      "In Review": "under_review",
      "Approved": "approved",
      "Closed": "closed",
      "Urgent": "under_review"
    };

    const severityMap: Record<Severity, ("info" | "warning" | "urgent")> = {
      "Critical": "urgent",
      "High": "warning",
      "Medium": "info",
      "Low": "info"
    };

    const statusValue = editData.status ? statusMap[editData.status as Status] : undefined;
    const severityValue = editData.severity ? severityMap[editData.severity as Severity] : undefined;

    updateMutation.mutate({
      reportId: report.originalId ?? report.id,
      reporterType: report.reporterType,
      updates: {
        status: statusValue,
        severity: severityValue,
        adminNotes: editData.adminNotes,
        ...fullDetailsEdit
      }
    });

    return { ...report, ...editData as Report, fullDetails: { ...report.fullDetails, ...fullDetailsEdit } };
  };

  return {
    downloadingXml,
    downloadingPdf,
    downloadingBulk,
    saved,
    updateMutation,
    regenerateMutation,
    handleDownloadPdf,
    handleDownloadXml,
    handleBulkDownload,
    handleRegenerate,
    executeUpdate
  };
}
