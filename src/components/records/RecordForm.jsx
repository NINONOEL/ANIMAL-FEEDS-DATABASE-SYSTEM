import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Modal from '../ui/Modal';
import { PROVINCES, MUNICIPALITIES, BARANGAYS, NATURE_OF_BUSINESS_TYPES } from '../../data/constants';
import { C } from '../../data/colors';

const currentYear = new Date().getFullYear();

const EMPTY = {
  nameOfEstablishment:'', brgy:'', municipality:'', province:'', sex:'',
  registrationNumber:'',
  manufacturer:0, feedIngredientsMfr:0, feedRetailer:0,
  feedDistributor:0, feedDealer:0, feedImporter:0,
  feedSupplier:0, feedIndentor:0, feedExporter:0,
  orNumber:'', orDate:'', fee:'', registration:'', lto:'',
  validity:'', remarks:'',
};

function SecHeader({ icon, label, sub }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom:`1px solid ${C.p3}` }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background:`linear-gradient(135deg,${C.p1},${C.deep})` }}>
        <Icon icon={icon} className="text-white text-sm" />
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide leading-tight" style={{ color:C.text }}>{label}</h3>
        {sub && <p className="text-[10px] leading-tight" style={{ color:C.p2 }}>{sub}</p>}
      </div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color:C.dark }}>
        {label}{required && <span style={{ color:C.p1 }} className="ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color:C.p1 }}>
          <Icon icon="mdi:alert-circle-outline" className="text-xs" />{error}
        </p>
      )}
    </div>
  );
}

const base = { border:`1px solid ${C.p3}`, background:C.white, color:C.text, outline:'none' };
const err  = { border:`1px solid ${C.p1}` };
const sel  = { ...base, background:C.bg };

export default function RecordForm({ isOpen, onClose, onSave, initialData, isEditing }) {
  const [form,setForm]     = useState(EMPTY);
  const [saving,setSaving] = useState(false);
  const [errors,setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const baseData = initialData ? { ...EMPTY, ...initialData } : { ...EMPTY };
      baseData.validity = normalizeValidityDate(baseData.validity);
      setForm(baseData);
      setErrors({});
    }
  }, [isOpen, initialData]);

  const munis = form.province ? (MUNICIPALITIES[form.province]||[]) : [];
  const brgys = form.municipality && form.province
    ? (BARANGAYS[form.province]?.[form.municipality]||[]) : [];

  function set(key, val) {
    setForm(prev => {
      const next = {...prev,[key]:val};
      if (key==='province')     { next.municipality=''; next.brgy=''; }
      if (key==='municipality') { next.brgy=''; }
      return next;
    });
    if (errors[key]) setErrors(prev=>({...prev,[key]:''}));
  }

  function validate() {
    const e = {};
    if (!form.nameOfEstablishment.trim()) e.nameOfEstablishment='Required';
    if (!form.province)                  e.province='Required';
    if (!form.municipality)              e.municipality='Required';
    if (!form.brgy)                      e.brgy='Required';
    if (!form.registration)              e.registration='Required';
    if (!form.lto)                       e.lto='Required';
    setErrors(e);
    return Object.keys(e).length===0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {...form};
      NATURE_OF_BUSINESS_TYPES.forEach(n=>{ data[n.key]=Number(data[n.key])||0; });
      data.fee = data.fee!=='' ? Number(data.fee) : null;
      data.orDate = normalizeDateInput(data.orDate);
      data.validity = normalizeDateInput(data.validity);
      await onSave(data);
      onClose();
    } finally { setSaving(false); }
  }

  const cls = 'w-full text-sm rounded-lg px-3 py-2 transition-all';

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={isEditing?'Edit Animal Feeds Record':'Add New Animal Feeds Record'}
      subtitle="Department of Agriculture – MIMAROPA Region Field Office"
      size="md">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* APPLICATION DETAILS */}
        <section>
          <SecHeader icon="mdi:clipboard-text-outline" label="Application Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="md:col-span-2">
              <Field label="Name of Establishment" required error={errors.nameOfEstablishment}>
                <input type="text" value={form.nameOfEstablishment}
                  onChange={e=>set('nameOfEstablishment',e.target.value)}
                  placeholder="Enter establishment name"
                  className={cls}
                  style={{...base,...(errors.nameOfEstablishment?err:{})}}
                  onFocus={e=>e.target.style.borderColor=C.p1}
                  onBlur={e=>e.target.style.borderColor=errors.nameOfEstablishment?C.p1:C.p3} />
              </Field>
            </div>

            {[
              {label:'Province',     key:'province',     required:true, opts:PROVINCES.map(p=>({v:p,l:p})),       disabled:false },
              {label:'Municipality', key:'municipality', required:true, opts:munis.map(m=>({v:m,l:m})),           disabled:!form.province },
              {label:'Barangay',     key:'brgy',         required:true, opts:brgys.map(b=>({v:b,l:b})),           disabled:!form.municipality },
            ].map(f=>(
              <Field key={f.key} label={f.label} required={f.required} error={errors[f.key]}>
                <select value={form[f.key]} onChange={e=>set(f.key,e.target.value)}
                  disabled={f.disabled} className={`${cls} disabled:opacity-50`}
                  style={{...sel,...(errors[f.key]?err:{})}}>
                  <option value="">Select {f.label}</option>
                  {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </Field>
            ))}

            <Field label="Sex">
              <select value={form.sex} onChange={e=>set('sex',e.target.value)} className={cls} style={sel}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>

            <Field label="Registration Number">
              <input type="text" value={form.registrationNumber}
                onChange={e=>set('registrationNumber',e.target.value)}
                placeholder="e.g. D-18-1489" className={cls} style={base} />
            </Field>
          </div>
        </section>

        {/* NATURE OF BUSINESS */}
        <section>
          <SecHeader icon="mdi:briefcase-outline" label="Nature of Business"
            sub="Enter number of records per type (0 if none)" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {NATURE_OF_BUSINESS_TYPES.map(n=>(
              <div key={n.key} className="rounded-xl p-3 text-center"
                style={{ background:`linear-gradient(135deg,${C.bg},${C.p4}55)`, border:`1px solid ${C.p3}` }}>
                <p className="text-[10px] font-semibold leading-tight mb-2" style={{ color:C.text }}>{n.short}</p>
                <input type="number" min="0" value={form[n.key]}
                  onChange={e=>set(n.key,e.target.value)}
                  className="w-full text-center text-sm font-bold rounded-lg py-1.5 focus:outline-none"
                  style={{ border:`1px solid ${C.p2}`, color:C.text }} />
              </div>
            ))}
          </div>
        </section>

        {/* STATUS */}
        <section>
          <SecHeader icon="mdi:badge-account-outline" label="Status" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Field label="OR Number">
              <input type="text" value={form.orNumber} onChange={e=>set('orNumber',e.target.value)}
                placeholder="e.g. 2470007723" className={cls} style={base} />
            </Field>

            <Field label="OR Date">
              <input type="date" value={form.orDate} onChange={e=>set('orDate',e.target.value)}
                className={cls} style={base} />
            </Field>

            <Field label="Fee (₱)">
              <input type="number" min="0" value={form.fee} onChange={e=>set('fee',e.target.value)}
                placeholder="0.00" className={cls} style={base} />
            </Field>

            <Field label="Registration" required error={errors.registration}>
              <div className="flex gap-4 mt-1">
                {[{v:'new',l:'New'},{v:'renew',l:'Renew'}].map(opt=>(
                  <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="registration" value={opt.v}
                      checked={form.registration===opt.v} onChange={()=>set('registration',opt.v)}
                      className="w-4 h-4" style={{ accentColor:C.p1 }} />
                    <span className="text-sm font-semibold" style={{ color:C.text }}>{opt.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="LTO" required error={errors.lto}>
              <div className="flex gap-4 mt-1">
                {[{v:'updated',l:'Updated'},{v:'expired',l:'Expired'}].map(opt=>(
                  <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="lto" value={opt.v}
                      checked={form.lto===opt.v} onChange={()=>set('lto',opt.v)}
                      className="w-4 h-4" style={{ accentColor:C.p1 }} />
                    <span className="text-sm font-semibold" style={{ color:C.text }}>{opt.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="md:col-span-2">
              <Field label="Validity">
                <input
                  type="date"
                  value={form.validity}
                  onChange={e=>set('validity',e.target.value)}
                  className={cls}
                  style={base}
                />
                <p className="text-[10px] mt-0.5" style={{ color:C.p2 }}>Default: December 31 annually</p>
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Remarks">
                <textarea rows={2} value={form.remarks} onChange={e=>set('remarks',e.target.value)}
                  placeholder="Additional notes..." className={`${cls} resize-none`} style={base} />
              </Field>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3" style={{ borderTop:`1px solid ${C.p3}` }}>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white transition-colors"
            style={{ border:`1px solid ${C.p3}`, color:C.p1 }}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg}
            onMouseLeave={e=>e.currentTarget.style.background=C.white}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ background:`linear-gradient(135deg,${C.p1},${C.deep})` }}>
            {saving
              ? <><Icon icon="mdi:loading" className="animate-spin" /> Saving...</>
              : <><Icon icon={isEditing?'mdi:content-save-outline':'mdi:plus'} />
                  {isEditing?'Save Changes':'Add Record'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function normalizeValidityDate(value) {
  return normalizeDateInput(value);
}

function normalizeDateInput(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yy = m[3];
    return `${yy}-${mm}-${dd}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const mo = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}
