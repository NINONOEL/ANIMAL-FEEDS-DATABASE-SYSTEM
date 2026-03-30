import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useRecords } from '../hooks/useRecords';
import { useToast } from '../context/ToastContext';
import RecordForm from '../components/records/RecordForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { PROVINCES, MUNICIPALITIES, NATURE_OF_BUSINESS_TYPES } from '../data/constants';
import { C } from '../data/colors';

const PAGE_SIZE = 15;

function Badge({ children, variant }) {
  const s = {
    new:     { background: C.p1,   color: 'white' },
    renew:   { background: C.p2,   color: 'white' },
    updated: { background: C.p4,   color: C.text, border: `1px solid ${C.p3}` },
    expired: { background: C.deep, color: 'white' },
  }[variant] || { background: C.p3, color: C.text };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={s}>
      {children}
    </span>
  );
}

/* ── view modal ─────────────────────────────────────────────── */
function ViewModal({ record, isOpen, onClose, onEdit }) {
  if (!record) return null;
  const nob = NATURE_OF_BUSINESS_TYPES.filter(n => Number(record[n.key]) > 0);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Details" subtitle={record.nameOfEstablishment} size="lg">
      <div className="space-y-5">

        <Sec title="Application Details" icon="mdi:clipboard-text-outline">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2"><Lbl>Name</Lbl><Val>{record.nameOfEstablishment}</Val></div>
            <div><Lbl>Address</Lbl><Val>{[record.brgy,record.municipality,record.province].filter(Boolean).join(', ')||'—'}</Val></div>
            <div><Lbl>Sex</Lbl><Val>{record.sex||'—'}</Val></div>
            <div><Lbl>Reg. Number</Lbl><Val mono>{record.registrationNumber||'—'}</Val></div>
          </div>
        </Sec>

        {nob.length > 0 && (
          <Sec title="Nature of Business" icon="mdi:briefcase-outline">
            <div className="flex flex-wrap gap-2">
              {nob.map(n => (
                <span key={n.key} className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${C.p4}`, color: C.text, border: `1px solid ${C.p3}` }}>
                  {n.short} ×{record[n.key]}
                </span>
              ))}
            </div>
          </Sec>
        )}

        <Sec title="Status" icon="mdi:badge-account-outline">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><Lbl>OR Number</Lbl><Val>{record.orNumber||'—'}</Val></div>
            <div><Lbl>OR Date</Lbl><Val>{record.orDate||'—'}</Val></div>
            <div><Lbl>Fee</Lbl><Val>{record.fee!=null&&record.fee!==''?`₱${Number(record.fee).toLocaleString()}`:'—'}</Val></div>
            <div><Lbl>Registration</Lbl>
              {record.registration
                ? <Badge variant={record.registration}>{record.registration==='new'?'New':'Renew'}</Badge>
                : <Val>—</Val>}
            </div>
            <div><Lbl>LTO</Lbl>
              {record.lto
                ? <Badge variant={record.lto}>{record.lto==='updated'?'Updated':'Expired'}</Badge>
                : <Val>—</Val>}
            </div>
            <div><Lbl>Validity</Lbl><Val>{record.validity||'—'}</Val></div>
            {record.remarks && <div className="col-span-2 sm:col-span-3"><Lbl>Remarks</Lbl><Val>{record.remarks}</Val></div>}
          </div>
        </Sec>

        <div className="flex justify-end gap-3 pt-2" style={{ borderTop:`1px solid ${C.p3}` }}>
          <Btn outline onClick={onClose}>Close</Btn>
          <Btn primary onClick={()=>{onClose();onEdit();}}>
            <Icon icon="mdi:pencil-outline" /> Edit
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function Sec({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Icon icon={icon} className="text-base" style={{ color: C.p1 }} />
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}
function Lbl({ children }) { return <span className="text-xs block mb-0.5" style={{ color: C.p2 }}>{children}</span>; }
function Val({ children, mono }) {
  return <span className={`font-medium text-sm ${mono?'font-mono':''}`} style={{ color: C.text }}>{children||'—'}</span>;
}
function Btn({ children, primary, outline, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
      style={primary
        ? { background:`linear-gradient(135deg,${C.p1},${C.deep})`, color:'white' }
        : { border:`1px solid ${C.p3}`, color:C.p1, background:C.white }}>
      {children}
    </button>
  );
}

/* ── main page ─────────────────────────────────────────────── */
export default function RecordsPage() {
  const { records, loading, addRecord, updateRecord, deleteRecord } = useRecords();
  const { addToast } = useToast();

  const [search,setSearch]                             = useState('');
  const [filterProvince,setFilterProvince]             = useState('');
  const [filterMunicipality,setFilterMunicipality]     = useState('');
  const [filterReg,setFilterReg]                       = useState('');
  const [filterLto,setFilterLto]                       = useState('');
  const [page,setPage]                                 = useState(1);
  const [formOpen,setFormOpen]                         = useState(false);
  const [editRecord,setEditRecord]                     = useState(null);
  const [viewRecord,setViewRecord]                     = useState(null);
  const [viewOpen,setViewOpen]                         = useState(false);
  const [deleteId,setDeleteId]                         = useState(null);
  const [isDeleting,setIsDeleting]                    = useState(false);

  const munis = filterProvince ? (MUNICIPALITIES[filterProvince]||[]) : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (filterProvince     && r.province     !== filterProvince)     return false;
      if (filterMunicipality && r.municipality !== filterMunicipality) return false;
      if (filterReg          && r.registration !== filterReg)          return false;
      if (filterLto          && r.lto          !== filterLto)          return false;
      if (q) {
        const hay = `${r.nameOfEstablishment} ${r.registrationNumber} ${r.orNumber} ${r.brgy} ${r.municipality} ${r.province}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records,search,filterProvince,filterMunicipality,filterReg,filterLto]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const paged      = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const resetPage  = () => setPage(1);

  async function handleSave(data) {
    try {
      if (editRecord) { await updateRecord(editRecord.id,data); addToast('Record updated!','success'); }
      else            { await addRecord(data); addToast('Record added!','success'); }
      setEditRecord(null);
    } catch (err) {
      const msg = err?.message ? `Failed to save: ${err.message}` : 'Failed to save.';
      addToast(msg,'error');
      throw err;
    }
  }
  async function handleDelete() {
    if (!deleteId || isDeleting) return;
    setIsDeleting(true);
    try { await deleteRecord(deleteId); addToast('Record deleted.','success'); }
    catch { addToast('Failed to delete.','error'); }
    finally { setDeleteId(null); setIsDeleting(false); }
  }

  const openAdd  = ()    => { setEditRecord(null); setFormOpen(true); };
  const openEdit = (rec) => { setEditRecord(rec);  setFormOpen(true); };
  const openView = (rec) => { setViewRecord(rec);  setViewOpen(true); };
  const clearFilters = () => { setSearch('');setFilterProvince('');setFilterMunicipality('');setFilterReg('');setFilterLto('');resetPage(); };
  const hasFilters   = search||filterProvince||filterMunicipality||filterReg||filterLto;
  const nobLabels    = r => NATURE_OF_BUSINESS_TYPES.filter(n=>Number(r[n.key])>0).map(n=>n.short).join(', ');

  const strongBorder = C.p2;
  const softBorder = C.p3;
  const selStyle = {
    border: `1.5px solid ${strongBorder}`,
    background: C.bg,
    color: C.text,
    fontSize: 12,
    borderRadius: 10,
    padding: '7px 10px',
  };

  return (
    <div className="space-y-5">
      {/* page heading */}
      <div
        className="rounded-2xl px-5 py-4 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${C.p4}, ${C.white})`,
          border: `1.5px solid ${strongBorder}`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.p1}, ${C.deep})` }}
            >
              <Icon icon="mdi:database-outline" className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-base font-extrabold leading-tight" style={{ color: C.text }}>Animal Feeds Records</h2>
              <p className="text-xs" style={{ color: C.p1 }}>Manage, filter, and review establishment records</p>
            </div>
          </div>
          <div
            className="text-xs font-semibold rounded-lg px-3 py-1.5"
            style={{ color: C.text, background: `${C.p4}99`, border: `1px solid ${softBorder}` }}
          >
            Total: {filtered.length}
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div className="rounded-2xl shadow-sm p-5"
        style={{ background:C.white, border:`1.5px solid ${strongBorder}` }}>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-base"
              style={{ color: C.p2 }} />
            <input type="text" value={search}
              onChange={e=>{setSearch(e.target.value);resetPage();}}
              placeholder="Search by name, registration number, address..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl"
              style={{ border:`1.5px solid ${strongBorder}`, background:C.bg, color:C.text, outline:'none' }}
              onFocus={e=>e.target.style.borderColor=C.p1}
              onBlur={e=>e.target.style.borderColor=strongBorder}
            />
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-md flex-shrink-0 hover:opacity-90 transition-opacity"
            style={{ background:`linear-gradient(135deg,${C.p1},${C.deep})` }}>
            <Icon icon="mdi:plus" className="text-lg" /> Add Record
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select value={filterProvince} style={selStyle}
            onChange={e=>{setFilterProvince(e.target.value);setFilterMunicipality('');resetPage();}}>
            <option value="">All Provinces</option>
            {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterMunicipality} style={{...selStyle,opacity:filterProvince?1:0.5}} disabled={!filterProvince}
            onChange={e=>{setFilterMunicipality(e.target.value);resetPage();}}>
            <option value="">All Municipalities</option>
            {munis.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filterReg} style={selStyle} onChange={e=>{setFilterReg(e.target.value);resetPage();}}>
            <option value="">All Registration</option>
            <option value="new">New</option>
            <option value="renew">Renew</option>
          </select>
          <select value={filterLto} style={selStyle} onChange={e=>{setFilterLto(e.target.value);resetPage();}}>
            <option value="">All LTO</option>
            <option value="updated">Updated</option>
            <option value="expired">Expired</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs flex items-center gap-1 font-medium"
              style={{ color:C.p1 }}>
              <Icon icon="mdi:close-circle-outline" /> Clear
            </button>
          )}
          <span className="ml-auto text-xs font-medium" style={{ color:C.p2 }}>
            {filtered.length} record{filtered.length!==1?'s':''}
          </span>
        </div>
      </div>

      {/* table */}
      <div className="rounded-2xl shadow-sm overflow-hidden"
        style={{ background:C.white, border:`1.5px solid ${strongBorder}` }}>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3" style={{ color:C.p1 }}>
              <Icon icon="mdi:loading" className="text-3xl animate-spin" />
              <span className="font-medium">Loading records...</span>
            </div>
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Icon icon="mdi:database-off-outline" className="text-6xl mb-3" style={{ color:C.p3 }} />
            <p className="text-base font-semibold" style={{ color:C.p1 }}>No records found</p>
            <p className="text-sm mt-1" style={{ color:C.p2 }}>
              {hasFilters?'Try clearing your filters':'Click "Add Record" to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr style={{ background:`linear-gradient(135deg,${C.p1},${C.deep})` }}>
                  {['#','Name of Establishment','Municipality / Province / Barangay','Reg. No.','Nature of Business','Registration','LTO','Validity','Actions'].map((h,i)=>(
                    <th
                      key={i}
                      className={`px-4 py-3 font-semibold whitespace-nowrap text-white ${i>4?'text-center':'text-left'}`}
                      style={{ borderRight: i < 8 ? '1px solid rgba(255,255,255,0.30)' : 'none' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((rec,idx) => (
                  <tr key={rec.id}
                    style={{ borderBottom:`1.5px solid ${softBorder}`, background: idx%2===0 ? C.white : C.bg }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${C.p4}55`}
                    onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?C.white:C.bg}>
                    <td className="px-4 py-3 font-medium" style={{ color:C.p2, borderRight:`1px solid ${softBorder}` }}>{(page-1)*PAGE_SIZE+idx+1}</td>
                    <td className="px-4 py-3" style={{ borderRight:`1px solid ${softBorder}` }}>
                      <p className="font-semibold leading-tight" style={{ color:C.text }}>{rec.nameOfEstablishment}</p>
                      {rec.sex&&<p className="text-[10px] mt-0.5" style={{ color:C.p2 }}>{rec.sex}</p>}
                    </td>
                    <td className="px-4 py-3" style={{ borderRight:`1px solid ${softBorder}` }}>
                      {(() => {
                        const line1 = [rec.brgy, rec.municipality].filter(Boolean).join(', ');
                        return (
                          <div className="flex flex-col leading-tight">
                            <p
                              className="font-medium text-[11px] truncate"
                              style={{ color: line1 ? C.p1 : C.p3, maxWidth: 220 }}
                              title={line1 || ''}
                            >
                              {line1 || '—'}
                            </p>
                            <p className="text-[10px]" style={{ color:C.p2 }}>{rec.province || '—'}</p>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color:C.dark, borderRight:`1px solid ${softBorder}` }}>{rec.registrationNumber||'—'}</td>
                    <td className="px-4 py-3 max-w-[200px]" style={{ borderRight:`1px solid ${softBorder}` }}>
                      <p className="truncate" title={nobLabels(rec)} style={{ color:C.p1 }}>
                        {nobLabels(rec)||<span style={{ color:C.p3 }}>—</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ borderRight:`1px solid ${softBorder}` }}>
                      {rec.registration
                        ? <Badge variant={rec.registration}>{rec.registration==='new'?'New':'Renew'}</Badge>
                        : <span style={{ color:C.p3 }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ borderRight:`1px solid ${softBorder}` }}>
                      {rec.lto
                        ? <Badge variant={rec.lto}>{rec.lto==='updated'?'Updated':'Expired'}</Badge>
                        : <span style={{ color:C.p3 }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs" style={{ color:C.dark, borderRight:`1px solid ${softBorder}` }}>{rec.validity||'—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {[
                          { icon:'mdi:eye-outline',      bg:C.p4,            fg:C.text,  fn:()=>openView(rec),       tip:'View'   },
                          { icon:'mdi:pencil-outline',   bg:`${C.p3}55`,     fg:C.dark,  fn:()=>openEdit(rec),       tip:'Edit'   },
                          { icon:'mdi:trash-can-outline',bg:`${C.p1}22`,     fg:C.p1,    fn:()=>setDeleteId(rec.id), tip:'Delete' },
                        ].map((btn,i)=>(
                          <button key={i} onClick={btn.fn} title={btn.tip}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                            style={{ background:btn.bg }}>
                            <Icon icon={btn.icon} className="text-sm" style={{ color:btn.fg }} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop:`1.5px solid ${softBorder}` }}>
            <span className="text-xs" style={{ color:C.p2 }}>
              Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ color:C.p1 }}>
                <Icon icon="mdi:chevron-left" />
              </button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                const p = Math.max(1,Math.min(page-2,totalPages-4))+i;
                if(p<1||p>totalPages) return null;
                return (
                  <button key={p} onClick={()=>setPage(p)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={page===p
                      ? { background:`linear-gradient(135deg,${C.p1},${C.deep})`, color:'white' }
                      : { color:C.p1 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ color:C.p1 }}>
                <Icon icon="mdi:chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <RecordForm isOpen={formOpen} onClose={()=>{setFormOpen(false);setEditRecord(null);}}
        onSave={handleSave} initialData={editRecord} isEditing={!!editRecord} />
      <ViewModal record={viewRecord} isOpen={viewOpen} onClose={()=>setViewOpen(false)}
        onEdit={()=>openEdit(viewRecord)} />
      <ConfirmDialog isOpen={!!deleteId} title="Delete Record"
        message="Are you sure you want to permanently delete this record? This cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={()=>setDeleteId(null)} />
    </div>
  );
}
