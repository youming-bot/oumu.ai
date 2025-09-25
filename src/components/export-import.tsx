"use client";

import { AlertCircle, CheckCircle, Download, FileText, Upload } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  downloadBlob,
  exportAllData,
  generateFilename,
  importData,
  validateImportFile,
} from "@/lib/export-service";

interface ExportImportProps {
  onDataImported?: () => void;
}

export default function ExportImport({ onDataImported }: ExportImportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importFileId = useId();
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      importedFiles: number;
      importedTranscripts: number;
      importedSegments: number;
    };
  } | null>(null);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const blob = await exportAllData();
      const filename = generateFilename("all");
      downloadBlob(blob, filename);

      setImportResult({
        success: true,
        message: "All data exported successfully!",
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "导出数据失败",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImportFile(file)) {
      setImportResult({
        success: false,
        message: "Invalid file. Please select a JSON file under 50MB.",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importData(file);

      setImportResult({
        success: true,
        message: "Data imported successfully!",
        details: result,
      });

      // Notify parent component to refresh data
      onDataImported?.();
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "导入数据失败",
      });
    } finally {
      setIsImporting(false);
      // Clear the file input
      event.target.value = "";
    }
  };

  return (
    <Card className="space-y-4 p-6">
      <h3 className="font-medium text-lg">Data Management</h3>

      <div className="space-y-4">
        {/* Export Section */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">导出数据</h4>
          <p className="text-muted-foreground text-sm">
            下载所有您的音频文件、转录和学习数据作为备份。
          </p>
          <Button onClick={handleExportAll} disabled={isExporting} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "导出中..." : "导出所有数据"}
          </Button>
        </div>

        <div className="border-t pt-4">
          {/* Import Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">导入数据</h4>
            <p className="text-muted-foreground text-sm">从之前的备份文件恢复您的数据。</p>

            <label htmlFor="import-file" className="block">
              <Button
                asChild
                variant="outline"
                className="w-full cursor-pointer sm:w-auto"
                disabled={isImporting}
              >
                <div>
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? "导入中..." : "导入数据"}
                </div>
              </Button>
              <input
                id={importFileId}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{importResult.success ? "成功" : "错误"}</AlertTitle>
            <AlertDescription>
              {importResult.message}
              {importResult.details && (
                <div className="mt-2 text-sm">
                  <p>Files: {importResult.details.importedFiles}</p>
                  <p>Transcripts: {importResult.details.importedTranscripts}</p>
                  <p>Segments: {importResult.details.importedSegments}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Information */}
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-start space-x-2">
            <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Backup Information</p>
              <p className="text-muted-foreground">
                Your backup includes all audio files, transcriptions, translations, and learning
                progress. Files are stored in JSON format for easy portability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
