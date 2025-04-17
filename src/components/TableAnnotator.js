import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { Rnd } from 'react-rnd';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// Reusable TagInput component
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(false);

  const handleBlur = () => {
    if (input.trim()) {
      const tagArr = input.split(',').map(t => t.trim()).filter(Boolean);
      onChange([...tags, ...tagArr]);
      setInput('');
    }
    setEditing(false);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleDelete = tag => {
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p:1, background: '#fff' }}>
      {tags.map(tag => (
        <Box key={tag} sx={{ border: '1px solid #ccc', borderRadius: '4px', px: 1, py:0.5 }} onClick={() => handleDelete(tag)}>
          {tag} ×
        </Box>
      ))}
      {editing ? (
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Add tags"
          style={{ border: 'none', outline: 'none', minWidth: 80 }}
        />
      ) : (
        <Box sx={{ color: '#1976d2', cursor: 'pointer' }} onClick={() => setEditing(true)}>✎</Box>
      )}
    </Box>
  );
}

const TableAnnotator = ({ pdfFile, selectedPages, backendUrl, onAnnotationDataChange }) => {
  const [pagesData, setPagesData] = useState([]);
  const containerRefs = useRef({});

  // DPI settings for high-resolution rendering
  const DPI = 275;
  const scale = DPI / 72;

  // Initialize pagesData when pages change
  useEffect(() => {
    setPagesData(selectedPages.map(pg => ({ pg_no: pg, boxes: [], loading: true })));
  }, [selectedPages]);

  // After pagesData init, fetch predictions
  useEffect(() => {
    pagesData.forEach(pd => {
      if (!pd.loading) return;
      // wait for canvas
      setTimeout(() => {
        const canvas = containerRefs.current[pd.pg_no]?.querySelector('canvas');
        if (!canvas) return;
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        })
          .then(res => res.json())
          .then(res => {
            setPagesData(prev => prev.map(d => {
              if (d.pg_no !== pd.pg_no) return d;
              return {
                ...d,
                loading: false,
                boxes: res.bbox_data.map((bb, idx) => ({
                  id: idx,
                  bbox_data: bb,
                  x: bb.xyxy[0],
                  y: bb.xyxy[1],
                  w: bb.xyxy[2] - bb.xyxy[0],
                  h: bb.xyxy[3] - bb.xyxy[1],
                  tags: [],
                  selected: false,
                  tables_image: ''
                }))
              };
            }));
          });
      }, 500);
    });
  }, [pagesData, backendUrl]);

  // update parent
  useEffect(() => {
    onAnnotationDataChange && onAnnotationDataChange(pagesData);
  }, [pagesData]);

  const updateBox = (pg_no, id, x, y, w, h) => {
    setPagesData(prev => prev.map(pd => {
      if (pd.pg_no !== pg_no) return pd;
      return {
        ...pd,
        boxes: pd.boxes.map(b => {
          if (b.id !== id) return b;
          return {
            ...b,
            x,
            y,
            w: w !== undefined ? w : b.w,
            h: h !== undefined ? h : b.h
          };
        })
      };
    }));
  };

  const toggleSelect = (pg_no, id) => {
    setPagesData(prev => prev.map(pd => {
      if (pd.pg_no !== pg_no) return pd;
      const canvas = containerRefs.current[pg_no]?.querySelector('canvas');
      return {
        ...pd,
        boxes: pd.boxes.map(b => {
          if (b.id !== id) return b;
          const sel = !b.selected;
          let img = b.tables_image;
          if (sel && canvas) {
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(b.x, b.y, b.w, b.h);
            const off = document.createElement('canvas');
            off.width = b.w;
            off.height = b.h;
            off.getContext('2d').putImageData(imgData, 0, 0);
            img = off.toDataURL('image/png').split(',')[1];
          }
          return { ...b, selected: sel, tables_image: img };
        })
      };
    }));
  };

  const updateTags = (pg_no, id, tags) => {
    setPagesData(prev => prev.map(pd => {
      if (pd.pg_no !== pg_no) return pd;
      return {
        ...pd,
        boxes: pd.boxes.map(b => b.id === id ? { ...b, tags } : b)
      };
    }));
  };

  // Handler to add a new bounding box manually
  const addBox = (pg_no) => {
    setPagesData(prev => prev.map(pd => {
      if (pd.pg_no !== pg_no) return pd;
      const nextId = pd.boxes.length > 0 ? Math.max(...pd.boxes.map(b => b.id)) + 1 : 0;
      const x0 = 10, y0 = 10, w0 = 100, h0 = 50;
      return {
        ...pd,
        boxes: [
          ...pd.boxes,
          {
            id: nextId,
            bbox_data: { class_id: 0, xyxy: [x0, y0, x0 + w0, y0 + h0], xywh: [x0, y0, w0, h0] },
            x: x0,
            y: y0,
            w: w0,
            h: h0,
            tags: [],
            selected: false,
            tables_image: ''
          }
        ]
      };
    }));
  };

  return (
    <Document file={pdfFile} loading={<CircularProgress />}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
        {pagesData.map(pd => (
          <Box
            key={pd.pg_no}
            sx={{
              position: 'relative',
              mb: 4,
              width: '100%',
              maxWidth: 700,
              border: '1px solid #ccc'
            }}
            ref={el => containerRefs.current[pd.pg_no] = el}
          >
            {pd.loading && <CircularProgress />}
            <Button
              variant="outlined"
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
              onClick={() => addBox(pd.pg_no)}
            >
              Add Box
            </Button>
            <Box sx={{ width: '100%', '& canvas': { width: '100% !important', height: 'auto !important' } }}>
              <Page
                pageNumber={pd.pg_no}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Box>
            {pd.boxes.map(b => {
              const canvas = containerRefs.current[pd.pg_no]?.querySelector('canvas');
              const displayScale = canvas ? canvas.clientWidth / canvas.width : 1;
              return (
                <React.Fragment key={b.id}>
                  {/* Tags list placed outside top-left of the box */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: b.x * displayScale,
                      top: b.y * displayScale - 30,
                      zIndex: 1100,
                      background: '#fff',
                      p: '2px 4px',
                      borderRadius: 1,
                      boxShadow: 1
                    }}
                  >
                    <TagInput tags={b.tags} onChange={tags => updateTags(pd.pg_no, b.id, tags)} />
                  </Box>
                  <Rnd
                    size={{ width: b.w * displayScale, height: b.h * displayScale }}
                    position={{ x: b.x * displayScale, y: b.y * displayScale }}
                    bounds="parent"
                    style={{ border: b.selected ? '2px solid #4caf50' : '2px solid #f44336' }}
                    onDragStop={(e, d) => updateBox(pd.pg_no, b.id, d.x / displayScale, d.y / displayScale)}
                    onResizeStop={(e, dir, ref, delta, pos) => updateBox(pd.pg_no, b.id, pos.x / displayScale, pos.y / displayScale, ref.offsetWidth / displayScale, ref.offsetHeight / displayScale)}
                    onClick={() => toggleSelect(pd.pg_no, b.id)}
                  />
                </React.Fragment>
              );
            })}
          </Box>
        ))}
      </Box>
    </Document>
  );
};

export default TableAnnotator;
