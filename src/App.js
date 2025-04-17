import React, { useState } from 'react';
import { Container, Typography, Paper, Button, Box } from '@mui/material';
import PdfUploader from './components/PdfUploader';
import TableAnnotator from './components/TableAnnotator';
import exportJson from './utils/exportJson';

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedPages, setSelectedPages] = useState([]); // loaded pages
  const [annotationData, setAnnotationData] = useState([]); // table annotations

  const handleUpload = (file, pages) => {
    setPdfFile(file);
    setFileName(file.name);
    setSelectedPages(pages);
    setAnnotationData([]);
  };

  const handleExport = () => {
    const data = annotationData.flatMap(pd =>
      pd.boxes.filter(b => b.selected).map(b => ({
        pg_no: pd.pg_no,
        tables_image: b.tables_image,
        bbox_data: b.bbox_data,
        tags: b.tags
      }))
    );
    exportJson({
      file_name: fileName,
      selected_pages: selectedPages,
      data
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          PDF Page Selector & Tagger
        </Typography>
        <PdfUploader onUpload={handleUpload} />
      </Paper>
      {pdfFile && selectedPages.length > 0 && (
        <Box>
          <TableAnnotator
            pdfFile={pdfFile}
            selectedPages={selectedPages}
            backendUrl="http://localhost:8000/predict"
            onAnnotationDataChange={setAnnotationData}
          />
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleExport}>
            Download Annotations as JSON
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default App;
