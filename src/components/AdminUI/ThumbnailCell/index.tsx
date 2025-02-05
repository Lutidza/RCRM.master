'use client';

import React, { useState, useEffect } from 'react';
import type {
  DefaultCellComponentProps,
  DefaultServerCellComponentProps,
  PayloadComponent,
} from 'payload';

export type ThumbnailCellProps = DefaultCellComponentProps & {
  /** Ожидается строка с URL, разделёнными запятыми */
  value: string;
};

const ThumbnailCell: React.FC<ThumbnailCellProps> = (props) => {
  const { value, rowData } = props;

  useEffect(() => {
    console.log('[ThumbnailCell] Props:', props);
  }, [props]);

  // Преобразуем строку в массив URL
  const rawValue = value || (rowData?.images ? String(rowData.images) : '');
  const urls = rawValue ? rawValue.split(',').map((url) => url.trim()) : [];

  useEffect(() => {
    console.log('[ThumbnailCell] Parsed URLs:', urls);
  }, [urls]);

  const previewUrl = urls.length > 0 ? urls[0] : null;
  useEffect(() => {
    console.log('[ThumbnailCell] Preview URL:', previewUrl);
  }, [previewUrl]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!previewUrl) {
    return <span>Нет изображения</span>;
  }

  const openModal = () => {
    if (urls.length > 1) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <img
        src={previewUrl}
        alt="Превью"
        style={{ width: 50, height: 50, objectFit: 'cover', cursor: urls.length > 1 ? 'pointer' : 'default' }}
        onClick={openModal}
      />
      {isModalOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsModalOpen(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsModalOpen(false)} style={closeButtonStyle}>
              Закрыть
            </button>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {urls.map((u, idx) => (
                <img key={idx} src={u} alt={`Изображение ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: '80vh' }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  background: '#fff',
  padding: '20px',
  borderRadius: '4px',
  maxWidth: '90%',
  maxHeight: '90%',
  overflowY: 'auto',
  position: 'relative',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
};

// Оборачиваем компонент в объект с ключом default
const ThumbnailCellExport = { default: ThumbnailCell };

// Приводим к типу PayloadComponent
export default ThumbnailCellExport as unknown as PayloadComponent<
  DefaultServerCellComponentProps,
  DefaultCellComponentProps
>;
