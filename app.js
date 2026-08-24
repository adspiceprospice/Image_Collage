(function startPaperframe() {
  const {
    A4_PAGE,
    PHOTO_SIZES,
    getOrientedDimensions,
    getPrintQuality,
    packPhotos,
  } = window.PrintStudioLayout;

  const state = { photos: [] };
  let nextPhotoId = 1;
  const elements = {
    applyAll: document.querySelector('#apply-all'),
    batchSize: document.querySelector('#batch-size'),
    batchTools: document.querySelector('#batch-tools'),
    dropZone: document.querySelector('#drop-zone'),
    errorMessage: document.querySelector('#error-message'),
    fileInput: document.querySelector('#file-input'),
    photoCount: document.querySelector('#photo-count'),
    photoList: document.querySelector('#photo-list'),
    preview: document.querySelector('#preview'),
    printButton: document.querySelector('#print-button'),
    sheetSummary: document.querySelector('#sheet-summary'),
    template: document.querySelector('#photo-card-template'),
  };

  const sizeOptions = Object.entries(PHOTO_SIZES)
    .map(([id, size]) => `<option value="${id}">${size.label}</option>`)
    .join('');

  elements.batchSize.innerHTML = sizeOptions;
  elements.batchSize.value = '10x15';

  function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.hidden = !message;
  }

  function loadPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error(`${file.name} is not an image.`));
        return;
      }

      const url = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        resolve({
          id: `photo-${nextPhotoId++}`,
          name: file.name,
          url,
          pixelWidth: image.naturalWidth,
          pixelHeight: image.naturalHeight,
          sizeId: '10x15',
          orientation: image.naturalWidth >= image.naturalHeight ? 'landscape' : 'portrait',
        });
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`${file.name} could not be read.`));
      };

      image.src = url;
    });
  }

  async function addFiles(fileList) {
    showError('');
    const files = Array.from(fileList);
    if (!files.length) return;

    const results = await Promise.allSettled(files.map(loadPhoto));
    const failures = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        state.photos.push(result.value);
      } else {
        failures.push(result.reason.message);
      }
    }

    if (failures.length) {
      showError(failures.join(' '));
    }

    elements.fileInput.value = '';
    render();
  }

  function removePhoto(photoId) {
    const photo = state.photos.find(({ id }) => id === photoId);
    if (photo) URL.revokeObjectURL(photo.url);
    state.photos = state.photos.filter(({ id }) => id !== photoId);
    render();
  }

  function updatePhoto(photoId, updates) {
    const photo = state.photos.find(({ id }) => id === photoId);
    if (!photo) return;
    Object.assign(photo, updates);
    render();
  }

  function renderPhotoList() {
    elements.photoCount.textContent = state.photos.length;
    elements.batchTools.hidden = state.photos.length === 0;

    if (!state.photos.length) {
      elements.photoList.innerHTML =
        '<div class="list-empty">Added photos and their sizes will appear here.</div>';
      return;
    }

    elements.photoList.replaceChildren();

    for (const photo of state.photos) {
      const fragment = elements.template.content.cloneNode(true);
      const card = fragment.querySelector('.photo-card');
      const thumbnail = fragment.querySelector('.photo-thumb');
      const name = fragment.querySelector('.photo-name');
      const size = fragment.querySelector('.photo-size');
      const rotate = fragment.querySelector('.rotate-photo');
      const remove = fragment.querySelector('.remove-photo');
      const qualityLabel = fragment.querySelector('.quality');
      const dimensions = getOrientedDimensions(photo.sizeId, photo.orientation);
      const quality = getPrintQuality(
        photo.pixelWidth,
        photo.pixelHeight,
        dimensions.width,
        dimensions.height,
      );

      card.dataset.photoId = photo.id;
      thumbnail.src = photo.url;
      thumbnail.alt = `Preview of ${photo.name}`;
      name.textContent = photo.name;
      name.title = photo.name;
      size.innerHTML = sizeOptions;
      size.value = photo.sizeId;
      rotate.textContent = photo.orientation === 'portrait' ? 'Turn landscape' : 'Turn portrait';
      remove.setAttribute('aria-label', `Remove ${photo.name}`);
      qualityLabel.textContent = `${quality.dpi} dpi`;
      qualityLabel.classList.toggle('quality-low', quality.level === 'low');
      qualityLabel.title =
        quality.level === 'low'
          ? 'Below the recommended 300 dpi; this photo may print less sharply.'
          : 'Suitable for a sharp print at this size.';

      elements.photoList.append(fragment);
    }
  }

  function createPrintPhoto(photo) {
    return {
      ...photo,
      ...getOrientedDimensions(photo.sizeId, photo.orientation),
    };
  }

  function renderPreview() {
    if (!state.photos.length) {
      elements.preview.innerHTML = `
        <div class="preview-empty">
          <div class="empty-sheet" aria-hidden="true"><span></span><span></span><span></span></div>
          <h3>Your print sheets will appear here</h3>
          <p>Add two or more photos, or start with one and add the rest later.</p>
        </div>`;
      elements.sheetSummary.textContent = 'No sheets yet';
      elements.printButton.disabled = true;
      return;
    }

    const { pages, unplaced } = packPhotos(state.photos.map(createPrintPhoto), {
      margin: 5,
      gap: 3,
    });

    elements.preview.replaceChildren();

    for (const [pageIndex, page] of pages.entries()) {
      const wrapper = document.createElement('section');
      const label = document.createElement('div');
      const paper = document.createElement('div');

      wrapper.className = 'sheet-wrapper';
      label.className = 'sheet-label';
      label.textContent = `Sheet ${pageIndex + 1}`;
      paper.className = 'paper';
      paper.setAttribute('aria-label', `A4 sheet ${pageIndex + 1}`);

      for (const photo of page) {
        const frame = document.createElement('figure');
        const image = document.createElement('img');

        frame.className = 'print-photo';
        frame.style.setProperty('--screen-x', `${(photo.x / A4_PAGE.width) * 100}%`);
        frame.style.setProperty('--screen-y', `${(photo.y / A4_PAGE.height) * 100}%`);
        frame.style.setProperty('--screen-width', `${(photo.width / A4_PAGE.width) * 100}%`);
        frame.style.setProperty('--screen-height', `${(photo.height / A4_PAGE.height) * 100}%`);
        frame.style.setProperty('--print-x', `${photo.x}mm`);
        frame.style.setProperty('--print-y', `${photo.y}mm`);
        frame.style.setProperty('--print-width', `${photo.width}mm`);
        frame.style.setProperty('--print-height', `${photo.height}mm`);
        frame.title = `${photo.name} · ${PHOTO_SIZES[photo.sizeId].label}`;

        image.src = photo.url;
        image.alt = photo.name;
        frame.append(image);
        paper.append(frame);
      }

      wrapper.append(label, paper);
      elements.preview.append(wrapper);
    }

    if (unplaced.length) {
      showError(`${unplaced.length} photo size is too large for the printable A4 area.`);
    }

    const sheetWord = pages.length === 1 ? 'sheet' : 'sheets';
    const photoWord = state.photos.length === 1 ? 'photo' : 'photos';
    elements.sheetSummary.textContent = `${state.photos.length} ${photoWord} · ${pages.length} ${sheetWord}`;
    elements.printButton.disabled = pages.length === 0;
  }

  function render() {
    renderPhotoList();
    renderPreview();
  }

  elements.fileInput.addEventListener('change', (event) => addFiles(event.target.files));

  elements.dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    elements.dropZone.classList.add('is-dragging');
  });

  elements.dropZone.addEventListener('dragleave', () => {
    elements.dropZone.classList.remove('is-dragging');
  });

  elements.dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove('is-dragging');
    addFiles(event.dataTransfer.files);
  });

  elements.photoList.addEventListener('change', (event) => {
    if (!event.target.matches('.photo-size')) return;
    const card = event.target.closest('.photo-card');
    updatePhoto(card.dataset.photoId, { sizeId: event.target.value });
  });

  elements.photoList.addEventListener('click', (event) => {
    const card = event.target.closest('.photo-card');
    if (!card) return;

    if (event.target.closest('.remove-photo')) {
      removePhoto(card.dataset.photoId);
      return;
    }

    if (event.target.closest('.rotate-photo')) {
      const photo = state.photos.find(({ id }) => id === card.dataset.photoId);
      updatePhoto(photo.id, {
        orientation: photo.orientation === 'portrait' ? 'landscape' : 'portrait',
      });
    }
  });

  elements.applyAll.addEventListener('click', () => {
    for (const photo of state.photos) {
      photo.sizeId = elements.batchSize.value;
    }
    render();
  });

  elements.printButton.addEventListener('click', () => window.print());

  window.addEventListener('beforeunload', () => {
    for (const photo of state.photos) URL.revokeObjectURL(photo.url);
  });

  render();
})();
