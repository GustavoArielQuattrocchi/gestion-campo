interface Props {
  id: string
  label: string
  value: string
  suggestions: string[]
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}

/** Input con datalist para sugerencias locales (Responsable / Empresa). */
export default function AutocompleteTextField({
  id,
  label,
  value,
  suggestions,
  placeholder,
  disabled,
  onChange,
}: Props) {
  const listId = `${id}-list`
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="form-input"
        list={listId}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onChange={e => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {suggestions.map(s => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}
