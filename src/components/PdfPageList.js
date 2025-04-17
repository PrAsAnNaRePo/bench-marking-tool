import React from 'react';
import { Box, Card, CardContent, Typography, Chip, TextField, IconButton, Button } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import EditIcon from '@mui/icons-material/Edit';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function TagInput({ tags, onChange }) {
  const [input, setInput] = React.useState('');
  const [editing, setEditing] = React.useState(false);

  const handleInputChange = (e) => setInput(e.target.value);

  const handleInputBlur = () => {
    if (input.trim()) {
      const tagArr = input.split(',').map(t => t.trim()).filter(Boolean);
      onChange([...tags, ...tagArr]);
      setInput('');
    }
    setEditing(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleInputBlur();
    }
  };

  const handleDelete = (tag) => {
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mt: 1 }}>
      {tags.map(tag => (
        <Chip key={tag} label={tag} onDelete={() => handleDelete(tag)} />
      ))}
      {editing ? (
        <TextField
          size="small"
          value={input}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          autoFocus
          variant="standard"
          placeholder="Add tags"
          sx={{ minWidth: 80 }}
        />
      ) : (
        <IconButton size="small" onClick={() => setEditing(true)}><EditIcon fontSize="small" /></IconButton>
      )}
    </Box>
  );
}

const PdfPageList = ({ pdfFile, selectedPages, pagesMarked, markedPages = [], onPageSelect, onTagsChange }) => {
  if (!selectedPages.length) return null;

  // Prevent page selection when clicking inside tag input area or pen
  const handleCardClick = (e, pg_no) => {
    if (e.target.closest('.tag-input-area')) return;
    onPageSelect(pg_no);
  };

  return (
    <Document file={pdfFile} loading={<Typography>Loading PDF...</Typography>}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 700 }}>
          {selectedPages.map(pg_no => {
            const mark = pagesMarked.find(m => m.pg_no === pg_no) || { tags: [] };
            const isMarked = markedPages.includes(pg_no);
            return (
              <Card
                key={pg_no}
                sx={{ width: '100%', border: 2, borderColor: isMarked ? 'primary.main' : 'grey.300', position: 'relative', cursor: 'pointer', mb: 3 }}
                onClick={e => handleCardClick(e, pg_no)}
                elevation={isMarked ? 6 : 1}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Page {pg_no}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 700, background: '#f9f9f9', overflow: 'auto', mb: 2 }}>
                    <Page
                      pageNumber={pg_no}
                      width={600}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Box>
                  <div className="tag-input-area">
                    <TagInput tags={mark.tags} onChange={tags => onTagsChange(pg_no, tags)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Document>
  );
};


export default PdfPageList;
