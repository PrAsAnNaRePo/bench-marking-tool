import React, { useState } from 'react';
import { Container, Typography, Paper, Button, Box } from '@mui/material';
import PdfUploader from './components/PdfUploader';
import PdfPageList from './components/PdfPageList';
import exportJson from './utils/exportJson';

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedPages, setSelectedPages] = useState([]); // All loaded pages
  const [pagesMarked, setPagesMarked] = useState([]); // [{pg_no, tags: []}, ...]
  const [markedPages, setMarkedPages] = useState([]); // Pages the user has actively marked

  const handleUpload = (file, pages) => {
    setPdfFile(file);
    setFileName(file.name);
    setSelectedPages(pages);
    setPagesMarked(pages.map(pg => ({ pg_no: pg, tags: [] })));
    setMarkedPages([]);
  };

  // Ensure pagesMarked stays in sync with selectedPages
  React.useEffect(() => {
    setPagesMarked(marks =>
      selectedPages.map(pg_no => {
        const found = marks.find(m => m.pg_no === pg_no);
        return found ? found : { pg_no, tags: [] };
      })
    );
  }, [selectedPages]);

  // Mark/unmark a page as selected for export
  const handlePageSelect = (pg_no) => {
    setMarkedPages(prev => {
      if (prev.includes(pg_no)) {
        return prev.filter(p => p !== pg_no);
      } else {
        return [...prev, pg_no];
      }
    });
  };

  const handleTagsChange = (pg_no, tags) => {
    setPagesMarked(marks => marks.map(m => m.pg_no === pg_no ? { ...m, tags } : m));
  };

  const handleExport = () => {
    const filteredPagesMarked = pagesMarked
      .filter(m => markedPages.includes(m.pg_no))
      .map(m => ({ pg_no: m.pg_no, tags: m.tags }));
    exportJson({
      file_name: fileName,
      selected_pages: markedPages,
      pages_marked: filteredPagesMarked
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
          <PdfPageList
            pdfFile={pdfFile}
            selectedPages={selectedPages}
            pagesMarked={pagesMarked}
            markedPages={markedPages}
            onPageSelect={handlePageSelect}
            onTagsChange={handleTagsChange}
          />
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleExport}>
            Export Selection as JSON
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default App;
