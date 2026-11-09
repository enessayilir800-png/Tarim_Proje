/**
 * farmer-auth.js - TarımYol Çiftçi Defteri & Kayıtlı Ada/Parsel Yönetimi
 * En sade, en anlaşılır ve pratik şekilde tasarlanmıştır.
 */
(() => {
  const STORAGE_KEY_USER = 'tarimyol_active_farmer_v1';
  const STORAGE_KEY_FIELDS_PREFIX = 'tarimyol_farmer_fields_';

  // Aktif kullanıcıyı getir
  function getActiveUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      return data ? JSON.parse(data) : null;
    } catch (_) {
      return null;
    }
  }

  // Kullanıcıyı kaydet / çıkış yap
  function setActiveUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
    updateUI();
    updateQuickSelect();
    window.dispatchEvent(new CustomEvent('tarimyol:auth-change', { detail: user }));
  }

  // Kullanıcının kayıtlı tarlalarını getir
  function getFields(userId) {
    const uId = userId || getActiveUser()?.id || 'varsayilan_ciftci';
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FIELDS_PREFIX + uId);
      if (raw !== null) {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
      }
      // İlk açılışta çiftçiye yol göstermek için hazır örnek bir tarla
      const initialFields = [
        {
          id: 'tarla_ornek_1',
          name: 'Örnek Buğday Tarlam',
          province: 'Diyarbakır',
          district: 'Kayapınar',
          neighborhood: 'Çölgüzeli',
          block: '104',
          parcel: '12',
          area: 45,
          crop: 'wheat',
          cropName: 'Buğday',
          lat: 37.9333,
          lon: 40.1667,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEY_FIELDS_PREFIX + uId, JSON.stringify(initialFields));
      return initialFields;
    } catch (_) {
      return [];
    }
  }

  // Tarla kaydet (Ada & Parsel ile birlikte)
  function saveField(fieldData) {
    const user = getActiveUser();
    const uId = user?.id || 'varsayilan_ciftci';
    const fields = getFields(uId);

    const newField = {
      id: fieldData.id || `tarla_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: (fieldData.name || '').trim() || 'Yeni Tarlam',
      province: (fieldData.province || '').trim(),
      district: (fieldData.district || '').trim(),
      neighborhood: (fieldData.neighborhood || '').trim(),
      block: (fieldData.block || '').trim(),      // Ada No
      parcel: (fieldData.parcel || '').trim(),    // Parsel No
      area: parseFloat(fieldData.area) || 20,     // Dekar
      crop: fieldData.crop || 'wheat',
      cropName: fieldData.cropName || 'Buğday',
      lat: parseFloat(fieldData.lat) || 38.9637,
      lon: parseFloat(fieldData.lon) || 35.2433,
      createdAt: fieldData.createdAt || new Date().toISOString()
    };

    const index = fields.findIndex(f => f.id === newField.id);
    if (index >= 0) {
      fields[index] = newField;
    } else {
      fields.unshift(newField);
    }

    localStorage.setItem(STORAGE_KEY_FIELDS_PREFIX + uId, JSON.stringify(fields));
    renderFieldsList();
    updateQuickSelect();
    updateUI();
    window.dispatchEvent(new CustomEvent('tarimyol:fields-change', { detail: fields }));
    return newField;
  }

  // Tarla sil
  function removeField(fieldId) {
    const user = getActiveUser();
    const uId = user?.id || 'varsayilan_ciftci';
    let fields = getFields(uId);
    fields = fields.filter(f => f.id !== fieldId);
    localStorage.setItem(STORAGE_KEY_FIELDS_PREFIX + uId, JSON.stringify(fields));
    renderFieldsList();
    updateQuickSelect();
    updateUI();
    window.dispatchEvent(new CustomEvent('tarimyol:fields-change', { detail: fields }));
  }

  // Tarlayı Plan Sayfasına Aktar
  function loadFieldToPlan(fieldId) {
    const fields = getFields();
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    window.location.hash = '#/plan';

    setTimeout(() => {
      const locInput = document.getElementById('location');
      const latInput = document.getElementById('latitude');
      const lonInput = document.getElementById('longitude');
      const areaInput = document.getElementById('area');
      const cropSelect = document.getElementById('crop');
      const locStatus = document.getElementById('location-status');

      if (locInput) locInput.value = `${field.province} ${field.district} ${field.neighborhood} (Ada:${field.block} Parsel:${field.parcel})`.trim();
      if (latInput) latInput.value = field.lat.toFixed(6);
      if (lonInput) lonInput.value = field.lon.toFixed(6);
      if (areaInput) areaInput.value = field.area;
      if (cropSelect && field.crop) cropSelect.value = field.crop;
      if (locStatus) {
        locStatus.textContent = `✓ "${field.name}" seçildi (Ada: ${field.block}, Parsel: ${field.parcel}). "Yol haritamı oluştur"a basabilirsiniz.`;
        locStatus.style.color = '#2e6a43';
      }

      closeModal('farmer-auth-modal');
    }, 150);
  }

  // Tarlayı Haritaya Aktar ve Rüzgar/Fıskiye/İlaçlama Analizini Aç
  function loadFieldToMap(fieldId) {
    const fields = getFields();
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    window.location.hash = '#/parcels';
    closeModal('farmer-auth-modal');

    setTimeout(() => {
      if (window.focusFieldOnMap) {
        window.focusFieldOnMap(field);
      }
      if (window.AgroAdvisor && window.AgroAdvisor.loadForCoordinates) {
        window.AgroAdvisor.loadForCoordinates(field.lat, field.lon, field);
      }
      // Hızlı seçim kutusunu da eşle
      const quickSelect = document.getElementById('quick-field-select');
      if (quickSelect) quickSelect.value = field.id;
    }, 200);
  }

  // Üst bardaki çiftçi butonunu güncelle
  function updateUI() {
    const user = getActiveUser();
    const userBtn = document.getElementById('farmer-auth-btn');
    const badgeText = document.getElementById('farmer-badge-text');
    const fieldsCount = getFields().length;

    if (userBtn && badgeText) {
      if (user) {
        userBtn.classList.add('logged-in');
        badgeText.innerHTML = `👨‍🌾 <strong>${escapeHtml(user.name)}</strong> (${fieldsCount} Tarla)`;
      } else {
        userBtn.classList.remove('logged-in');
        badgeText.innerHTML = `🌾 <span>Tarlalarım & Çiftçi Girişi (${fieldsCount})</span>`;
      }
    }

    renderFieldsList();
  }

  // Harita üzerindeki hızlı tarla seçme kutusunu güncelle
  function updateQuickSelect() {
    const select = document.getElementById('quick-field-select');
    if (!select) return;

    const fields = getFields();
    select.innerHTML = '<option value="">🚜 -- Kayıtlı Tarlalarından Birini Seç --</option>' +
      fields.map(f => {
        const adaParsel = (f.block && f.parcel) ? `[Ada: ${f.block} / Parsel: ${f.parcel}]` : '';
        return `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)} ${adaParsel}</option>`;
      }).join('');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.hidden = false;
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.hidden = true;
      document.body.style.overflow = '';
    }
  }

  // Kayıtlı Tarlalar Listesini Render Et
  function renderFieldsList() {
    const container = document.getElementById('farmer-saved-fields-list');
    const emptyNotice = document.getElementById('farmer-no-fields-notice');
    if (!container) return;

    const fields = getFields();

    if (!fields.length) {
      container.innerHTML = '';
      if (emptyNotice) emptyNotice.hidden = false;
      return;
    }

    if (emptyNotice) emptyNotice.hidden = true;

    container.innerHTML = fields.map(f => {
      const cropName = ({
        wheat: 'Buğday', barley: 'Arpa', corn: 'Mısır', sunflower: 'Ayçiçeği',
        chickpea: 'Nohut', lentil: 'Mercimek', cotton: 'Pamuk', tomato: 'Domates', potato: 'Patates'
      })[f.crop] || f.cropName || 'Karma Ürün';

      const locParts = [f.province, f.district, f.neighborhood].filter(Boolean).join(' / ');

      return `
        <div class="farmer-field-card" data-field-id="${escapeHtml(f.id)}">
          <div class="field-card-header">
            <div>
              <h4>🌾 ${escapeHtml(f.name)}</h4>
              <span class="field-loc-text">📍 ${escapeHtml(locParts || 'Konum belirtilmedi')}</span>
            </div>
            <span class="field-crop-chip">${escapeHtml(cropName)} · ${f.area} Dekar</span>
          </div>
          
          <div class="field-cadastre-badge">
            <span class="badge-block-parcel">🏷️ <b>ADA:</b> ${escapeHtml(f.block || '—')}</span>
            <span class="badge-block-parcel">🏷️ <b>PARSEL:</b> ${escapeHtml(f.parcel || '—')}</span>
          </div>

          <div class="field-card-actions">
            <button type="button" class="btn-field-action btn-show-map" data-action="map" data-id="${escapeHtml(f.id)}">
              🗺️ Haritada Aç (Rüzgar & İlaçlama Gör)
            </button>
            <button type="button" class="btn-field-action btn-send-plan" data-action="plan" data-id="${escapeHtml(f.id)}">
              📋 Sezon Planı
            </button>
            <button type="button" class="btn-field-delete" data-action="delete" data-id="${escapeHtml(f.id)}" title="Tarlayı Sil">
              🗑️ Sil
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function init() {
    updateUI();
    updateQuickSelect();

    // Üst bar ve Menü Giriş Butonları
    document.getElementById('farmer-auth-btn')?.addEventListener('click', () => {
      openModal('farmer-auth-modal');
      switchTab('tab-my-fields');
    });

    // Hızlı seçim kutusu (Harita üzerindeki kutudan seçim yapınca)
    document.getElementById('quick-field-select')?.addEventListener('change', (e) => {
      const fieldId = e.target.value;
      if (fieldId) {
        loadFieldToMap(fieldId);
      }
    });

    // Modal Kapatma
    document.querySelectorAll('.btn-close-farmer-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.farmer-modal-overlay');
        if (modal) closeModal(modal.id);
      });
    });

    // Sekmeler (Tab geçişleri)
    document.querySelectorAll('.farmer-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    // Sade Giriş Formu
    const loginForm = document.getElementById('farmer-login-form');
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('farmer-input-name')?.value.trim();
      if (!name) return;

      const user = {
        id: `ciftci_${Date.now()}`,
        name: name,
        loginTime: new Date().toISOString()
      };

      setActiveUser(user);
      switchTab('tab-my-fields');

      const loginStatus = document.getElementById('farmer-login-status');
      if (loginStatus) {
        loginStatus.textContent = `✓ Hoş geldin, ${name}! Tarlaların bu cihaza kaydedildi.`;
        loginStatus.style.color = '#2e6a43';
      }
    });

    // Çıkış Butonu
    document.getElementById('btn-farmer-logout')?.addEventListener('click', () => {
      if (confirm('Çiftçi hesabınızdan çıkmak istiyor musunuz?')) {
        setActiveUser(null);
        switchTab('tab-login');
      }
    });

    // Yeni Ada & Parsel Ekleme Formu
    const addFieldForm = document.getElementById('farmer-add-field-form');
    addFieldForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('field-name-input')?.value.trim() || 'Yeni Tarlam';
      const province = document.getElementById('field-province-input')?.value.trim() || '';
      const district = document.getElementById('field-district-input')?.value.trim() || '';
      const neighborhood = document.getElementById('field-neighborhood-input')?.value.trim() || '';
      const block = document.getElementById('field-block-input')?.value.trim() || '';
      const parcel = document.getElementById('field-parcel-input')?.value.trim() || '';
      const area = parseFloat(document.getElementById('field-area-input')?.value) || 20;
      const crop = document.getElementById('field-crop-select')?.value || 'wheat';

      const saved = saveField({
        name, province, district, neighborhood, block, parcel, area, crop
      });

      addFieldForm.reset();
      switchTab('tab-my-fields');
      alert(`✓ "${saved.name}" (Ada: ${saved.block}, Parsel: ${saved.parcel}) başarıyla kaydedildi! Artık her açtığınızda tek tıkla yükleyebilirsiniz.`);
    });

    // Liste Tıklama Olayları
    document.getElementById('farmer-saved-fields-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'map') {
        loadFieldToMap(id);
      } else if (action === 'plan') {
        loadFieldToPlan(id);
      } else if (action === 'delete') {
        if (confirm('Bu tarlayı defterinizden silmek istediğinize emin misiniz?')) {
          removeField(id);
        }
      }
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.farmer-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.farmer-tab-content').forEach(c => {
      c.hidden = c.id !== tabId;
    });

    const user = getActiveUser();
    const logoutWrap = document.getElementById('farmer-logout-wrap');
    if (logoutWrap) logoutWrap.hidden = !user;
  }

  window.FarmerAuth = {
    getUser: getActiveUser,
    setUser: setActiveUser,
    getFields,
    saveField,
    removeField,
    loadFieldToPlan,
    loadFieldToMap,
    openModal,
    closeModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
