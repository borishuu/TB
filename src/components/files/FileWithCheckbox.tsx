import BaseFileCard from '@/components/files/BaseFileCard';
import { useState } from 'react';
import { PoolFile } from '@/types';

export default function FileWithCheckbox({
  file,
  onDelete,
  onCheckboxChange,
}: {
  file: PoolFile;
  onDelete?: (id: number) => void;
  onCheckboxChange?: (fileId: number, checked: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
    onCheckboxChange?.(file.id, e.target.checked);
  };

  return (
    <BaseFileCard file={file} onDelete={onDelete}>
      <label className="text-xs flex items-center space-x-1">
        <input type="checkbox" checked={checked} onChange={handleChange} />
        <span className="text-sm font-medium">Inspiration</span>
      </label>
    </BaseFileCard>
  );
}
