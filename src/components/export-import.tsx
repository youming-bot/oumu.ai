'use client';

import { useState } from 'react';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExportService } from '@/lib/export-service';

interface ExportImportProps {
  onDataImported?: () => void;
}

export default function ExportImport({ onDataImported }: ExportImportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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
      const blob = await ExportService.exportAllData();
      const filename = ExportService.generateFilename('all');
      ExportService.downloadBlob(blob, filename);
      
      setImportResult({
        success: true,
        message: 'All data exported successfully!'
      });
    } catch (error) {
      console.error('Export failed:', error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export data'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ExportService.validateImportFile(file)) {
      setImportResult({
        success: false,
        message: 'Invalid file. Please select a JSON file under 50MB.'
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await ExportService.importData(file);
      
      setImportResult({
        success: true,
        message: 'Data imported successfully!',
        details: result
      });

      // Notify parent component to refresh data
      onDataImported?.();
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import data'
      });
    } finally {
      setIsImporting(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-medium">Data Management</h3>
      
      <div className="space-y-4">
        {/* Export Section */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Export Data</h4>
          <p className="text-sm text-muted-foreground">
            Download all your audio files, transcripts, and learning data as a backup.
          </p>
          <Button
            onClick={handleExportAll}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </Button>
        </div>

        <div className="border-t pt-4">
          {/* Import Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Import Data</h4>
            <p className="text-sm text-muted-foreground">
              Restore your data from a previous backup file.
            </p>
            
            <label htmlFor="import-file" className="block">
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto cursor-pointer"
                disabled={isImporting}
              >
                <div>
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                </div>
              </Button>
              <input
                id="import-file"
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
          <Alert variant={importResult.success ? 'default' : 'destructive'}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {importResult.success ? 'Success' : 'Error'}
            </AlertTitle>
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
        <div className="bg-muted p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Backup Information</p>
              <p className="text-muted-foreground">
                Your backup includes all audio files, transcriptions, translations, and learning progress.
                Files are stored in JSON format for easy portability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}