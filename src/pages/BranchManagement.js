import React from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const branches = [
  { name: 'Dindori', bank: 'Bank Of Maharashtra' },
  { name: 'Peth', bank: 'Axis Bank' },
  { name: 'Trimurti', bank: 'HDFC Bank' },
  { name: 'Pune', bank: 'Saraswat Bank' },
  { name: 'Kalyan', bank: 'Bank Of Maharashtra' },
];

const BranchManagement = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    bankName: '',
    branchName: '',
    officer: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    // Add branch logic here
    setOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Available Branches</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Branch
          </Button>
        </Box>

        <Grid container spacing={3}>
          {branches.map((branch) => (
            <Grid item xs={12} sm={6} md={4} key={branch.name}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 },
                  }}
                >
                  <Typography variant="h6">{branch.name}</Typography>
                  <Typography color="textSecondary">{branch.bank}</Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Add New Branch</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Bank Name"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Branch Name"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                margin="normal"
              />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Allocate Officer</InputLabel>
                <Select
                  name="officer"
                  value={formData.officer}
                  onChange={handleChange}
                  label="Allocate Officer"
                >
                  <MenuItem value="officer1">Officer 1</MenuItem>
                  <MenuItem value="officer2">Officer 2</MenuItem>
                  <MenuItem value="officer3">Officer 3</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => setOpen(false)}
              >
                Add Data File
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Add Branch
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default BranchManagement;
