import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Chip,
  Box,
  Alert
} from '@mui/material';
import { SelectionData } from '../utils/textSelection';

interface BiasType {
  id: string;
  name: string;
  description: string;
  category: 'bias' | 'rhetoric' | 'fallacy' | 'other';
  color: string;
}

const BIAS_TYPES: BiasType[] = [
  {
    id: 'loaded-language',
    name: 'Loaded Language',
    description: 'Words and phrases with strong emotional implications that influence the reader',
    category: 'bias',
    color: '#e57373'
  },
  {
    id: 'name-calling',
    name: 'Name Calling',
    description: 'Labeling the object of the claim in a negative way',
    category: 'bias',
    color: '#ef5350'
  },
  {
    id: 'exaggeration',
    name: 'Exaggeration',
    description: 'Representing something in an excessive manner',
    category: 'bias',
    color: '#f44336'
  },
  {
    id: 'appeal-to-fear',
    name: 'Appeal to Fear',
    description: 'Seeking to build support by instilling fear against an opponent',
    category: 'rhetoric',
    color: '#9575cd'
  },
  {
    id: 'appeal-to-authority',
    name: 'Appeal to Authority',
    description: 'Using the opinion of an authority figure to persuade',
    category: 'rhetoric',
    color: '#7e57c2'
  },
  {
    id: 'bandwagon',
    name: 'Bandwagon',
    description: 'Appealing to popularity or the fact that many people do something',
    category: 'rhetoric',
    color: '#673ab7'
  },
  {
    id: 'false-dilemma',
    name: 'False Dilemma',
    description: 'Presenting two alternative options as the only possibilities',
    category: 'fallacy',
    color: '#ffb74d'
  },
  {
    id: 'straw-man',
    name: 'Straw Man',
    description: 'Misrepresenting someone\'s argument to make it easier to attack',
    category: 'fallacy',
    color: '#ffa726'
  },
  {
    id: 'slippery-slope',
    name: 'Slippery Slope',
    description: 'Asserting that one event must inevitably lead to another',
    category: 'fallacy',
    color: '#ff9800'
  }
];

interface BiasTaggerProps {
  open: boolean;
  onClose: () => void;
  selectedText: string;
  existingTags?: {type: string, confidence: number}[];
  onApplyTags: (tags: {type: string, confidence: number}[]) => void;
}

const BiasTagger: React.FC<BiasTaggerProps> = ({ 
  open, 
  onClose, 
  selectedText, 
  existingTags = [], 
  onApplyTags 
}) => {
  const [selectedBiasType, setSelectedBiasType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  
  const handleApply = () => {
    const biasType = BIAS_TYPES.find(bias => bias.id === selectedBiasType);
    if (selectedText && biasType) {
      // Convert to the tag format expected by onApplyTags
      const newTag = {
        type: biasType.id,
        confidence: 1.0 // Default confidence, could be adjusted based on user input
      };
      
      // Combine with existing tags, avoiding duplicates
      const updatedTags = [...existingTags];
      const existingIndex = updatedTags.findIndex(t => t.type === newTag.type);
      
      if (existingIndex >= 0) {
        updatedTags[existingIndex] = newTag;
      } else {
        updatedTags.push(newTag);
      }
      
      onApplyTags(updatedTags);
      reset();
      onClose();
    }
  };
  
  const reset = () => {
    setSelectedBiasType('');
    setNotes('');
  };
  
  const handleClose = () => {
    reset();
    onClose();
  };
  
  const filteredBiasTypes = BIAS_TYPES.filter(biasType => 
    filter === 'all' || biasType.category === filter
  );
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Tag Text with Bias/Rhetorical Analysis</DialogTitle>
      <DialogContent>
        {!selectedText ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No text selection detected. Please select text to tag.
          </Alert>
        ) : (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">Selected text:</Typography>
            <Typography variant="body1">"{selectedText}"</Typography>
          </Box>
        )}
        
        {/* Show existing tags if any */}
        {existingTags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Existing tags:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {existingTags.map((tag, index) => {
                const biasType = BIAS_TYPES.find(b => b.id === tag.type);
                return (
                  <Chip 
                    key={index}
                    label={`${biasType?.name || tag.type} (${Math.round(tag.confidence * 100)}%)`}
                    size="small"
                    style={{ backgroundColor: biasType?.color }}
                    onDelete={() => {
                      const updatedTags = existingTags.filter((_, i) => i !== index);
                      onApplyTags(updatedTags);
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', mb: 3, gap: 1 }}>
          <Chip 
            label="All" 
            color={filter === 'all' ? 'primary' : 'default'} 
            onClick={() => setFilter('all')} 
            sx={{ cursor: 'pointer' }}
          />
          <Chip 
            label="Bias" 
            color={filter === 'bias' ? 'primary' : 'default'} 
            onClick={() => setFilter('bias')} 
            sx={{ cursor: 'pointer', bgcolor: filter === 'bias' ? undefined : '#ffebee' }}
          />
          <Chip 
            label="Rhetoric" 
            color={filter === 'rhetoric' ? 'primary' : 'default'} 
            onClick={() => setFilter('rhetoric')} 
            sx={{ cursor: 'pointer', bgcolor: filter === 'rhetoric' ? undefined : '#e8eaf6' }}
          />
          <Chip 
            label="Fallacy" 
            color={filter === 'fallacy' ? 'primary' : 'default'} 
            onClick={() => setFilter('fallacy')} 
            sx={{ cursor: 'pointer', bgcolor: filter === 'fallacy' ? undefined : '#fff3e0' }}
          />
        </Box>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Bias/Rhetoric Type</InputLabel>
          <Select
            value={selectedBiasType}
            onChange={(e) => setSelectedBiasType(e.target.value)}
            disabled={!selectedText}
          >
            {filteredBiasTypes.map((biasType) => (
              <MenuItem key={biasType.id} value={biasType.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: biasType.color,
                      mr: 1
                    }} 
                  />
                  <Typography>{biasType.name}</Typography>
                  <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                    ({biasType.category})
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {selectedBiasType && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {BIAS_TYPES.find(b => b.id === selectedBiasType)?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {BIAS_TYPES.find(b => b.id === selectedBiasType)?.description}
            </Typography>
          </Box>
        )}
        
        <TextField
          fullWidth
          label="Your Analysis Notes"
          multiline
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!selectedText || !selectedBiasType}
          placeholder="Explain why this text demonstrates the selected bias or rhetorical technique..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleApply}
          disabled={!selectedText || !selectedBiasType}
        >
          Apply Tag
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BiasTagger; 