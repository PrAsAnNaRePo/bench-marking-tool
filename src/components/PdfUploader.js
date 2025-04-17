import React, { useRef, useState } from 'react';
import { Button, TextField, Box, Typography } from '@mui/material';

function PdfUploader({ onUpload }) {
  const fileInputRef = useRef();
  const [pagesInput, setPagesInput] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    fileInputRef.current = file;
  };

  const handlePagesChange = (e) => {
    setPagesInput(e.target.value);
  };

  const parsePages = (input) => {
    // Support: 1,2,3 or 1-3,5
    let pages = [];
    input.split(',').forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) pages.push(i);
        }
      } else {
        const num = Number(part);
        if (num) pages.push(num);
      }
    });
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const file = fileInputRef.current;
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }
    const pages = parsePages(pagesInput);
    if (!pages.length) {
      setError('Enter valid page numbers.');
      return;
    }
    onUpload(file, pages);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        variant="outlined"
        component="label"
      >
        Upload PDF
        <input
          hidden
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
      </Button>
      <TextField
        label="Pages to Load (e.g. 1,2,4-6)"
        value={pagesInput}
        onChange={handlePagesChange}
        variant="outlined"
        size="small"
        required
      />
      {error && <Typography color="error">{error}</Typography>}
      <Button type="submit" variant="contained">Load Pages</Button>
    </Box>
  );
}

export default PdfUploader;
