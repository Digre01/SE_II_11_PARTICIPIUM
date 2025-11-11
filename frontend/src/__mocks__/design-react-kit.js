const React = require('react');
// Forward unknown props (onChange, name, etc.) so components behave like form controls in tests
const Input = ({ id, label, ...rest }) => React.createElement('input', { id, 'aria-label': label, ...rest });
const TextArea = ({ id, label, ...rest }) => React.createElement('textarea', { id, 'aria-label': label, ...rest });
const Select = ({ id, label, children, onChange, ...rest }) => React.createElement('select', { id, 'aria-label': label, onChange: (e) => onChange && onChange(e.target.value), ...rest }, children);
const Upload = (props) => React.createElement('input', { type: 'file', 'data-testid': 'upload', ...props });
const UploadList = ({ children }) => React.createElement('div', null, children);
const UploadListItem = ({ fileName }) => React.createElement('div', null, fileName || 'file');
const Form = ({ children, onSubmit }) => React.createElement('form', { onSubmit }, children);
const FormGroup = ({ children }) => React.createElement('div', null, children);
const Button = ({ children, ...props }) => React.createElement('button', props, children);
const Alert = ({ children }) => React.createElement('div', null, children);
module.exports = { Input, TextArea, Select, Upload, UploadList, UploadListItem, Form, FormGroup, Button, Alert };
