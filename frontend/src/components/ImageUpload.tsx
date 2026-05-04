"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ onUpload, maxFiles = 5 }: ImageUploadProps) {
  const [files, setFiles] = useState<(File & { preview: string })[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [
      ...prev,
      ...acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }))
    ].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles
  });

  const removeFile = (name: string) => {
    setFiles(files.filter(f => f.name !== name));
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      // Simulación de envío a n8n / Storage Bridge
      // En producción, aquí se hace el fetch a /api/upload
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));

      // Simulamos latencia de red y retorno de URLs reales
      await new Promise(r => setTimeout(r, 1500));
      const mockUrls = files.map((_, i) => `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=800&q=80`);
      
      onUpload(mockUrls);
      setFiles([]);
      alert("¡Imágenes subidas con éxito!");
    } catch (err) {
      alert("Error al subir imágenes");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
          isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:bg-white/5",
          files.length >= maxFiles && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
          <Upload size={24} />
        </div>
        <div className="text-center">
          <p className="font-medium">Arrastra tus fotos aquí</p>
          <p className="text-xs text-muted-foreground">O haz clic para seleccionar (Máx {maxFiles})</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {files.map(file => (
            <div key={file.name} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10">
              <img src={file.preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeFile(file.name)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <Button 
          onClick={handleUpload} 
          disabled={uploading}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <><ImageIcon size={18} /> Procesar {files.length} Imágenes</>}
        </Button>
      )}
    </div>
  );
}
