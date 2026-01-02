import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';

export function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : "auto",
    position: "relative",
    height: "100%",
    // touchAction: "none" // Recommended for pointer events
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </Box>
  );
}
