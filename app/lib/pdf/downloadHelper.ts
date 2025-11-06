/**
 * Downloads a blob as a file with the specified filename
 */
export function downloadBlob(blob: Blob, filename: string) {
  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  window.URL.revokeObjectURL(url);
}

/**
 * Fetches and downloads a PDF from the API
 */
export async function fetchAndDownloadPDF(formData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/fill-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al generar el PDF");
    }

    // Get the blob from the response
    const blob = await response.blob();
    
    // Extract filename from Content-Disposition header or generate one
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "Solicitud_Fintera.pdf";
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Download the file
    downloadBlob(blob, filename);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error downloading PDF:", error);
    return {
      success: false,
      error: error.message || "Error al descargar el PDF"
    };
  }
}
