/**
 * Image Captioning AI - Frontend JavaScript
 * CodSoft Artificial Intelligence Internship - Task 3
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const imageInput = document.getElementById('imageInput');
    const chooseBtn = document.getElementById('chooseBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const previewContainer = document.getElementById('previewContainer');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    const generateBtn = document.getElementById('generateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const captionBox = document.getElementById('captionBox');
    const captionText = document.getElementById('captionText');
    const captionMeta = document.getElementById('captionMeta');
    const copyBtn = document.getElementById('copyBtn');
    const alertBanner = document.getElementById('alertBanner');
    const alertMessage = document.getElementById('alertMessage');
    const alertCloseBtn = document.getElementById('alertCloseBtn');
    const modelStatusIndicator = document.getElementById('modelStatusIndicator');

    // Constants
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

    let selectedFile = null;

    // Check Backend Model Status on Page Load
    fetchModelStatus();

    // Event Listeners
    chooseBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        handleFileSelection(file);
    });

    generateBtn.addEventListener('click', handleGenerateCaption);
    resetBtn.addEventListener('click', handleReset);
    copyBtn.addEventListener('click', handleCopyCaption);
    alertCloseBtn.addEventListener('click', hideAlert);

    // Drag and Drop support on preview container
    ['dragenter', 'dragover'].forEach(eventName => {
        previewContainer.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewContainer.style.borderColor = '#2563eb';
            previewContainer.style.backgroundColor = '#eff6ff';
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        previewContainer.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewContainer.style.borderColor = '#cbd5e1';
            previewContainer.style.backgroundColor = '#f1f5f9';
        });
    });

    previewContainer.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt && dt.files && dt.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });

    /**
     * Handles file validation and displays the image preview.
     */
    function handleFileSelection(file) {
        hideAlert();

        if (!file) {
            return;
        }

        // Validate file extension
        const fileNameParts = file.name.split('.');
        const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop().toLowerCase() : '';

        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            showAlert(`Unsupported file format (.${fileExtension || 'unknown'}). Please choose a JPG, JPEG, or PNG image.`, 'error');
            imageInput.value = '';
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            showAlert(`File is too large (${sizeInMB} MB). Maximum allowed size is 10 MB.`, 'error');
            imageInput.value = '';
            return;
        }

        selectedFile = file;
        fileNameDisplay.textContent = `${file.name} (${formatBytes(file.size)})`;

        // Load instant image preview using FileReader
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreview.classList.remove('hidden');
            previewPlaceholder.classList.add('hidden');
            generateBtn.disabled = false;
            resetBtn.classList.remove('hidden');

            // Reset caption box to placeholder for new image
            captionText.className = 'placeholder-text';
            captionText.textContent = 'Click "Generate Caption" to analyze this image.';
            captionMeta.classList.add('hidden');
            copyBtn.classList.add('hidden');
        };
        reader.onerror = () => {
            showAlert('Failed to read the selected file. Please try another image.', 'error');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Sends the selected image to the backend and handles response.
     */
    async function handleGenerateCaption() {
        hideAlert();

        if (!selectedFile) {
            showAlert('Please select an image first before generating a caption.', 'warning');
            return;
        }

        // Prepare UI for processing
        setLoading(true);

        const formData = new FormData();
        formData.append('image', selectedFile);

        const startTime = performance.now();

        try {
            const response = await fetch('/api/caption', {
                method: 'POST',
                body: formData
            });

            const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(2);
            const data = await response.json();

            if (response.ok && data.success) {
                // Display caption
                captionText.className = 'caption-content';
                captionText.textContent = data.caption;
                copyBtn.classList.remove('hidden');

                const modelTag = data.model || 'Salesforce BLIP';
                const deviceTag = data.device ? ` | Device: ${data.device.toUpperCase()}` : '';
                captionMeta.textContent = `Model: ${modelTag}${deviceTag} | Time: ${elapsedSec}s`;
                captionMeta.classList.remove('hidden');
            } else {
                // Backend returned an error
                const errorMsg = data.error || 'Failed to generate caption. Please try again.';
                displayCaptionError(errorMsg);
                showAlert(errorMsg, 'error');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            const networkErrorMsg = 'Network error or server unreachable. Please make sure the Python server is running.';
            displayCaptionError(networkErrorMsg);
            showAlert(networkErrorMsg, 'error');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Checks model availability and updates status indicator.
     */
    async function fetchModelStatus() {
        try {
            const res = await fetch('/api/status');
            if (res.ok) {
                const status = await res.json();
                if (status.loaded) {
                    modelStatusIndicator.textContent = `Model Ready: ${status.model_name} (on ${status.device.toUpperCase()})`;
                    modelStatusIndicator.style.color = '#15803d'; // Green
                } else if (status.error) {
                    modelStatusIndicator.textContent = `Notice: ${status.error}`;
                    modelStatusIndicator.style.color = '#b45309'; // Amber
                } else {
                    modelStatusIndicator.textContent = `Model: ${status.model_name} (Ready to initialize)`;
                }
            } else {
                modelStatusIndicator.textContent = 'Server status: Connected';
            }
        } catch {
            modelStatusIndicator.textContent = 'Server status: Offline';
            modelStatusIndicator.style.color = '#dc2626';
        }
    }

    /**
     * Clears current selection and resets interface.
     */
    function handleReset() {
        selectedFile = null;
        imageInput.value = '';
        fileNameDisplay.textContent = 'No file chosen';
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
        previewPlaceholder.classList.remove('hidden');
        generateBtn.disabled = true;
        resetBtn.classList.add('hidden');

        captionText.className = 'placeholder-text';
        captionText.textContent = 'The generated description appears here.';
        captionMeta.classList.add('hidden');
        copyBtn.classList.add('hidden');

        hideAlert();
    }

    /**
     * Copies caption text to clipboard.
     */
    function handleCopyCaption() {
        const textToCopy = captionText.textContent;
        if (!textToCopy || captionText.classList.contains('placeholder-text')) {
            return;
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#dcfce7';
            copyBtn.style.borderColor = '#86efac';

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '';
                copyBtn.style.borderColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }

    /**
     * Updates loading state and disables/enables action buttons.
     */
    function setLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
            generateBtn.disabled = true;
            chooseBtn.disabled = true;
            resetBtn.disabled = true;
        } else {
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = !selectedFile;
            chooseBtn.disabled = false;
            resetBtn.disabled = false;
        }
    }

    /**
     * Displays error within the caption display card.
     */
    function displayCaptionError(message) {
        captionText.className = 'placeholder-text';
        captionText.style.color = '#b91c1c';
        captionText.textContent = `Error: ${message}`;
        captionMeta.classList.add('hidden');
        copyBtn.classList.add('hidden');
    }

    /**
     * Shows notification alert at the top.
     */
    function showAlert(message, type = 'error') {
        alertMessage.textContent = message;
        alertBanner.className = `alert-banner ${type}`;
        alertBanner.classList.remove('hidden');
    }

    /**
     * Hides notification alert.
     */
    function hideAlert() {
        alertBanner.classList.add('hidden');
    }

    /**
     * Formats bytes into KB or MB.
     */
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
});
