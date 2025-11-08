import React, { useState, useEffect } from "react";
import {
  Form,
  FormGroup,
  Input,
  Button,
  Alert,
  TextArea,
  Select,
  Upload,
  UploadList,
  UploadListItem
} from "design-react-kit";
import API from "../API/API.mjs";

const ReportForm = () => {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await API.fetchCategories();
        setCategories(cats);
      } catch (err) {
        setCategories([]);
      }
    }
    loadCategories();
  }, []);
  // Mock lat/lon
  const mockLat = 45.53452363;
  const mockLon = 45.53151353;
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    photos: [],
    latitude: mockLat,
    longitude: mockLon
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errorOpen, setErrorOpen] = useState(true);
  const [successOpen, setSuccessOpen] = useState(true);

  const handleChange = e => {
    if (!e.target || !e.target.name) return;
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = selectedOption => {
    setForm(prev => ({ ...prev, categoryId: selectedOption }));
  };

  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    setForm(prev => ({ ...prev, photos: files }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess("");
    setSuccessOpen(true);
    setErrorOpen(true);
    if (!form.title || !form.description || !form.categoryId || form.photos.length < 1 || form.photos.length > 3) {
      setError("Please fill all required fields and upload 1 to 3 images.");
      setErrorOpen(true);
      return;
    }
    setError("");
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("categoryId", form.categoryId);
    data.append("latitude", form.latitude);
    data.append("longitude", form.longitude);
    form.photos.forEach(photo => data.append("photos", photo));
    try {
      await API.createReport(data);
      setSuccess("Report submitted successfully!");
      setSuccessOpen(true);
      setForm({
        title: "",
        description: "",
        categoryId: "",
        photos: [],
        latitude: mockLat,
        longitude: mockLon
      });
    } catch (err) {
      setError(typeof err === "string" ? err : "Network error. Please try again later.");
      setErrorOpen(true);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <div className="card shadow-sm p-4">
        <h3 className="mb-4 text-primary text-center">Create a new report</h3>
        <Form onSubmit={handleSubmit}>
          <FormGroup className="mb-3">
            <Input
              name="title"
              id="title"
              value={form.title}
              onChange={handleChange}
              label="Title"
            />
          </FormGroup>
          <FormGroup className="mb-3">
            <TextArea
                label="Description"
                rows={3}
                name="description"
                id="description"
                value={form.description}
                onChange={handleChange}
            />
          </FormGroup>
          <FormGroup className="mb-5">
            <Select
              name="categoryId"
              id="categoryId"
              value={form.categoryId}
              onChange={handleCategoryChange}
              required
              label="Category"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} style={{ fontWeight: "normal" }}>{cat.name}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup className="mb-4">
            <div className="text-center mb-2">
              <Upload
                id="upload_foto"
                label="Upload 1 to 3 images"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                required
                style={{ margin: "0 auto", display: "inline-block" }}
              />
            </div>
            <div className="d-flex justify-content-center">
              <UploadList previewImage tipologia="file">
                {form.photos.map((file, idx) => (
                  <UploadListItem
                    key={idx}
                    fileName={file.name}
                    fileWeight={file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
                    previewImage
                    previewImageAlt={file.name}
                    previewImageSrc={URL.createObjectURL(file)}
                    uploadStatus="success"
                  />
                ))}
              </UploadList>
            </div>
          </FormGroup>
          <div className="row">
            <div className="col-6">
              <Input
                id="latitude"
                label="Latitude"
                value={form.latitude}
                readOnly
              />
            </div>
            <div className="col-6">
              <Input
                id="longitude"
                label="Longitude"
                value={form.longitude}
                readOnly
              />
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <Alert color="danger" isOpen={errorOpen} toggle={() => setErrorOpen(false)}>
                {error}
              </Alert>
            </div>
          )}
          {success && (
            <div className="mb-4">
              <Alert color="success" isOpen={successOpen} toggle={() => setSuccessOpen(false)}>
                {success}
              </Alert>
            </div>
          )}

          <Button
            color="primary"
            type="submit"
            block
            disabled={
              !form.title ||
              !form.description ||
              !form.categoryId ||
              form.photos.length < 1 ||
              form.photos.length > 3
            }
          >
            Submit
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default ReportForm;
