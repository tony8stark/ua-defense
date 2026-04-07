// Context menu for towers and buildings (sell, upgrade, repair)
import { DEF_META, UPGRADES, getUpgradeCost, getSellPrice, REPAIR_COST_PER_HP } from '../data/units.js';

export default function ContextMenu({ target, money, waveActive, onSell, onUpgrade, onRepair, onClose }) {
  if (!target) return null;

  const isTower = target.type === 'tower';
  const isBuilding = target.type === 'building';
  const item = target.item;

  return (
    <div
      style={{
        position: 'fixed',
        left: target.screenX,
        top: target.screenY,
        zIndex: 100,
        transform: 'translate(-50%, -100%)',
        marginTop: -8,
      }}
    >
      <div style={{
        background: '#0c1222ee',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '8px 10px',
        minWidth: 160,
        backdropFilter: 'blur(8px)',
      }}>
        {isTower && <TowerMenu item={item} money={money} waveActive={waveActive} onSell={onSell} onUpgrade={onUpgrade} />}
        {isBuilding && <BuildingMenu item={item} money={money} waveActive={waveActive} onRepair={onRepair} />}
        <button
          onClick={onClose}
          style={{
            display: 'block', width: '100%', marginTop: 4,
            padding: '4px 8px', fontSize: 9, color: '#64748b',
            background: 'none', border: 'none', textAlign: 'center',
          }}
        >
          Закрити
        </button>
      </div>
    </div>
  );
}

function TowerMenu({ item, money, waveActive, onSell, onUpgrade }) {
  const meta = DEF_META[item.type];
  const level = item.level || 0;
  const maxLevel = UPGRADES[item.type].length - 1;
  const canUpgrade = level < maxLevel;
  const upgradeCost = canUpgrade ? getUpgradeCost(item, item._mode) : null;
  const sellPrice = getSellPrice(item);

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, marginBottom: 2 }}>
        {meta.emoji} "{item.callsign || '???'}"
        <span style={{ fontSize: 8, color: '#64748b', marginLeft: 4 }}>
          {item.type !== 'decoy' ? `Рів.${level + 1}/${maxLevel + 1}` : ''}
        </span>
      </div>
      <div style={{ fontSize: 8, color: '#556678', marginBottom: 3 }}>{meta.name}</div>

      <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 6, lineHeight: 1.6 }}>
        {item.type !== 'decoy' ? (
          <>HP: {item.hp}/{item.maxHp} | 🎯{Math.round((item.hitChance || 0) * 100)}% | ⚡{item.damage} | 💀{item.kills || 0}</>
        ) : (
          <>HP: {item.hp}/{item.maxHp} | 🪤 Хибна ціль для Ланцетів</>
        )}
      </div>

      {canUpgrade && (
        <button
          onClick={() => onUpgrade(item)}
          disabled={money < upgradeCost || waveActive}
          style={{
            display: 'block', width: '100%',
            padding: '5px 8px', fontSize: 9, fontWeight: 700,
            background: money >= upgradeCost && !waveActive ? '#4ade8020' : '#1e293b',
            color: money >= upgradeCost && !waveActive ? '#4ade80' : '#475569',
            border: `1px solid ${money >= upgradeCost && !waveActive ? '#4ade8044' : '#1e293b'}`,
            borderRadius: 4, marginBottom: 3,
          }}
        >
          ⬆ Апгрейд — 💰{upgradeCost}
          <div style={{ fontSize: 7, color: '#64748b', marginTop: 1 }}>
            {UPGRADES[item.type][level + 1]?.desc}
          </div>
          {waveActive && <div style={{ fontSize: 7, color: '#f59e0b' }}>Тільки між хвилями</div>}
        </button>
      )}

      <button
        onClick={() => onSell(item)}
        style={{
          display: 'block', width: '100%',
          padding: '4px 8px', fontSize: 9, fontWeight: 700,
          background: '#ef444415', color: '#ef4444',
          border: '1px solid #ef444433', borderRadius: 4,
        }}
      >
        💰 Продати (+{sellPrice})
      </button>
    </div>
  );
}

function BuildingMenu({ item, money, waveActive, onRepair }) {
  const damaged = item.hp < item.maxHp && item.hp > 0;
  const repairAmount = item.maxHp - item.hp;
  const repairCost = Math.round(repairAmount * REPAIR_COST_PER_HP);

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: item.hp > 0 ? '#4ade80' : '#ef4444', marginBottom: 4 }}>
        {item.emoji} {item.name}
      </div>

      <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 6 }}>
        HP: {item.hp}/{item.maxHp}
      </div>

      {damaged && (
        <button
          onClick={() => onRepair(item)}
          disabled={money < repairCost || waveActive}
          style={{
            display: 'block', width: '100%',
            padding: '5px 8px', fontSize: 9, fontWeight: 700,
            background: money >= repairCost && !waveActive ? '#4ade8020' : '#1e293b',
            color: money >= repairCost && !waveActive ? '#4ade80' : '#475569',
            border: `1px solid ${money >= repairCost && !waveActive ? '#4ade8044' : '#1e293b'}`,
            borderRadius: 4,
          }}
        >
          🔧 Ремонт — 💰{repairCost} (+{repairAmount} HP)
          {waveActive && <div style={{ fontSize: 7, color: '#f59e0b', marginTop: 1 }}>Тільки між хвилями</div>}
        </button>
      )}

      {item.hp <= 0 && (
        <div style={{ fontSize: 8, color: '#7f1d1d' }}>Знищено. Ремонт неможливий.</div>
      )}

      {!damaged && item.hp > 0 && (
        <div style={{ fontSize: 8, color: '#4ade80' }}>Стан: повний</div>
      )}
    </div>
  );
}
