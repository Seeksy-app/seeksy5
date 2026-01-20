import html2canvas from 'html2canvas';

/**
 * Exports a DOM element as a PNG image
 * @param element - The HTML element to capture
 * @param username - The username to include in the filename
 */
export const exportCardAsImage = async (
  element: HTMLElement,
  username: string
): Promise<void> => {
  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Higher quality export
      logging: false,
      useCORS: true,
    });

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voice-certification-${username}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting card as image:', error);
    throw error;
  }
};
