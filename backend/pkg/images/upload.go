package images

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

const MaxUploadSize = 5 << 20 // 5 MB

var allowedMimeTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/gif":  ".gif",
}

var (
	ErrFileTooLarge    = errors.New("image exceeds the maximum allowed size (5MB)")
	ErrUnsupportedType = errors.New("unsupported image type: only JPEG, PNG and GIF are allowed")
	ErrNoFile          = errors.New("no image file provided")
)


func SaveUpload(w http.ResponseWriter, r *http.Request, formField, uploadDir string) (filename string, mimeType string, err error) {
	r.Body = http.MaxBytesReader(w, r.Body, MaxUploadSize+1<<20) // slack for multipart overhead

	if err := r.ParseMultipartForm(MaxUploadSize); err != nil {
		return "", "", fmt.Errorf("%w: %v", ErrFileTooLarge, err)
	}

	file, _, err := r.FormFile(formField)
	if err != nil {
		return "", "", ErrNoFile
	}
	defer file.Close()

	head := make([]byte, 512)
	n, err := io.ReadFull(file, head)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		return "", "", fmt.Errorf("failed to read upload: %w", err)
	}
	detected := http.DetectContentType(head[:n])

	ext, ok := allowedMimeTypes[detected]
	if !ok {
		return "", "", ErrUnsupportedType
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", "", fmt.Errorf("failed to seek upload: %w", err)
	}

	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return "", "", fmt.Errorf("failed to prepare upload dir: %w", err)
	}

	filename = uuid.NewString() + ext
	fullPath := filepath.Join(uploadDir, filename)

	dst, err := os.OpenFile(fullPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return "", "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	written, err := io.Copy(dst, io.LimitReader(file, MaxUploadSize))
	if err != nil {
		dst.Close()
		os.Remove(fullPath)
		return "", "", fmt.Errorf("failed to write file: %w", err)
	}
	if written >= MaxUploadSize {
		dst.Close()
		os.Remove(fullPath)
		return "", "", ErrFileTooLarge
	}

	return filename, detected, nil
}

func DeletePrevious(uploadDir, filename string) error {
	if filename == "" {
		return nil
	}
	err := os.Remove(filepath.Join(uploadDir, filename))
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}