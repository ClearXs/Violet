'use client';

import PathInput from './path-input';
import FilePicker from './file-picker';

interface PathInputFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder: string;
  description: string;
  className?: string;
  disabled?: boolean;
  enableFilePicker?: boolean;
  readOnly?: boolean;
  accept?: string;
  type?: 'file' | 'folder' | 'image' | 'audio';
  showPreview?: boolean;
  onPreview?: () => void;
  isPlaying?: boolean;
  multiple?: boolean;
  mode?: 'path' | 'picker';
}

const PathInputField = ({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  enableFilePicker = false,
  readOnly = true,
  accept = '*',
  type = 'file',
  showPreview = false,
  onPreview,
  isPlaying = false,
  multiple = false,
  mode = 'path',
}: PathInputFieldProps) => {
  if (mode === 'picker') {
    return (
      <FilePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        accept={accept}
        type={type}
        showPreview={showPreview}
        onPreview={onPreview}
        isPlaying={isPlaying}
        multiple={multiple}
        disabled={disabled}
      />
    );
  }

  return (
    <PathInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
      enableFilePicker={enableFilePicker}
    />
  );
};

export default PathInputField;
