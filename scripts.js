(function(){
  const topStrip = document.querySelector('.top-strip');
  const bottomStrip = document.querySelector('.bottom-strip');
  const wordIt = document.getElementById('word-it');
  const wordThis = document.getElementById('word-this');
  const info = document.getElementById('infobox');
  const DEFAULT_INFO = "click around and interact with the words, try 'it' or 'this'?";

  // init
  topStrip?.classList.remove('visible-by-it');
  bottomStrip?.classList.remove('visible-by-this');
  [wordIt, wordThis].forEach(el => el && (el.dataset.replaced ||= '0'));
  info && (info.textContent = DEFAULT_INFO, info.classList.add('visible'));

  function showTransient(msg, dur = 2500) {
    if (!info) return;
    clearTimeout(info._t);
    info.textContent = msg;
    info.classList.add('transient');
    info._t = setTimeout(() => {
      info.classList.remove('transient');
      info.textContent = DEFAULT_INFO;
    }, dur);
  }

  function updateStrips() {
    if (topStrip && wordIt) {
      (wordIt.dataset.replaced === '1')
        ? topStrip.classList.add('visible-by-it')
        : topStrip.classList.remove('visible-by-it');
    }
    if (bottomStrip && wordThis) {
      (wordThis.dataset.replaced === '1')
        ? bottomStrip.classList.add('visible-by-this')
        : bottomStrip.classList.remove('visible-by-this');
    }
  }

  function toggleReplace(el) {
    const label = el.querySelector('.label');
    const { original, replacement, replaced } = el.dataset;
    const wasReplaced = replaced === '1';
    label.textContent = wasReplaced ? original : replacement;
    el.dataset.replaced = wasReplaced ? '0' : '1';
    showTransient(wasReplaced ? `Restored "${original}"` : `"${original}" → "${replacement}"`);
    updateStrips();
  }

  document.querySelectorAll('.interactive-word').forEach(el => {
    el.addEventListener('click', e => { toggleReplace(e.currentTarget); e.currentTarget.blur(); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleReplace(e.currentTarget); }
    });
  });

  // Handle box clicks to show overlays
  document.querySelectorAll('.top-box').forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = box.querySelector('div').textContent;
      showOverlay('top', text, box);
    });
  });

  document.querySelectorAll('.bottom-box').forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = box.querySelector('div').textContent;
      showOverlay('bottom', text, box);
    });
  });

  function showOverlay(position, text, clickedBox) {
    // Remove any existing overlay for this position
    document.querySelectorAll(`.strip-overlay.${position}`).forEach(o => o.remove());
    
    // Create new overlay
    const overlay = document.createElement('div');
    overlay.className = `strip-overlay ${position} active`;
    
    const referencesDiv = clickedBox?.querySelector('.box-references');
    const descriptionEl = referencesDiv?.querySelector('.overlay-description');
    const referencesList = referencesDiv?.querySelector('.reference-list');
    
    const descriptionHTML = descriptionEl ? descriptionEl.innerHTML : '';
    const referencesHTML = referencesList ? referencesList.innerHTML : '';
    
    overlay.innerHTML = `
      <span class="overlay-close">✕</span>
      <div class="overlay-header">
        <h3>${text}</h3>
        ${descriptionHTML ? `<p class="overlay-description">${descriptionHTML}</p>` : ''}
      </div>
      ${referencesHTML ? `<ul class="reference-list">${referencesHTML}</ul>` : ''}
    `;
    
    document.body.appendChild(overlay);
    
    // Close button
    overlay.querySelector('.overlay-close').addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.remove();
    });
    
    // Prevent links from closing overlay
    overlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
  }

  // Click anywhere on page to close overlays based on screen half
  document.addEventListener('click', (e) => {
    const clickY = e.clientY;
    const halfHeight = window.innerHeight / 2;
    
    // Don't close if clicking on strips, boxes, or overlay content
    if (e.target.closest('.top-strip, .bottom-strip, .strip-overlay, .interactive-word, .container')) {
      return;
    }
    
    // Close top overlay if clicked in top half
    if (clickY < halfHeight) {
      document.querySelectorAll('.strip-overlay.top').forEach(o => o.remove());
    }
    
    // Close bottom overlay if clicked in bottom half
    if (clickY > halfHeight) {
      document.querySelectorAll('.strip-overlay.bottom').forEach(o => o.remove());
    }
  });

  updateStrips();

  // Hover highlighting for top-strip boxes and word-it
  const topStripBoxes = document.querySelectorAll('.top-strip .top-box');
  const bottomStripBoxes = document.querySelectorAll('.bottom-strip .bottom-box');

  // Hover on word-it highlights all top-strip boxes
  if (wordIt) {
    wordIt.addEventListener('mouseenter', () => {
      if (wordIt.dataset.replaced === '1' && topStrip?.classList.contains('visible-by-it')) {
        topStripBoxes.forEach(box => box.classList.add('highlight'));
      }
    });
    
    wordIt.addEventListener('mouseleave', () => {
      topStripBoxes.forEach(box => box.classList.remove('highlight'));
    });
  }

  // Hover on word-this highlights all bottom-strip boxes
  if (wordThis) {
    wordThis.addEventListener('mouseenter', () => {
      if (wordThis.dataset.replaced === '1' && bottomStrip?.classList.contains('visible-by-this')) {
        bottomStripBoxes.forEach(box => box.classList.add('highlight'));
      }
    });
    
    wordThis.addEventListener('mouseleave', () => {
      bottomStripBoxes.forEach(box => box.classList.remove('highlight'));
    });
  }

  // Hover on any top-strip box highlights word-it and all top boxes
  topStripBoxes.forEach((box, index) => {
    box.addEventListener('mouseenter', () => {
      if (topStrip?.classList.contains('visible-by-it')) {
        if (wordIt) wordIt.classList.add('highlight');
        topStripBoxes.forEach(b => b.classList.add('highlight'));
        
        // Also highlight corresponding bottom box
        if (bottomStripBoxes[index] && bottomStrip?.classList.contains('visible-by-this')) {
          bottomStripBoxes[index].classList.add('highlight');
        }
      }
    });
    
    box.addEventListener('mouseleave', () => {
      if (wordIt) wordIt.classList.remove('highlight');
      topStripBoxes.forEach(b => b.classList.remove('highlight'));
      
      // Remove highlight from corresponding bottom box
      if (bottomStripBoxes[index]) {
        bottomStripBoxes[index].classList.remove('highlight');
      }
    });
  });

  // Hover on any bottom-strip box highlights word-this and all bottom boxes
  bottomStripBoxes.forEach((box, index) => {
    box.addEventListener('mouseenter', () => {
      if (bottomStrip?.classList.contains('visible-by-this')) {
        if (wordThis) wordThis.classList.add('highlight');
        bottomStripBoxes.forEach(b => b.classList.add('highlight'));
        
        // Also highlight corresponding top box
        if (topStripBoxes[index] && topStrip?.classList.contains('visible-by-it')) {
          topStripBoxes[index].classList.add('highlight');
        }
      }
    });
    
    box.addEventListener('mouseleave', () => {
      if (wordThis) wordThis.classList.remove('highlight');
      bottomStripBoxes.forEach(b => b.classList.remove('highlight'));
      
      // Remove highlight from corresponding top box
      if (topStripBoxes[index]) {
        topStripBoxes[index].classList.remove('highlight');
      }
    });
  });
})();
