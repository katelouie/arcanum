import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'

export interface StatusOption {
  value: string
  label: string
  color: string
}

interface StatusListboxProps {
  value: string
  onChange: (value: string) => void
  options: StatusOption[]
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

export function StatusListbox({ 
  value, 
  onChange, 
  options, 
  size = 'sm',
  disabled = false,
  className = ""
}: StatusListboxProps) {
  const selectedOption = options.find(opt => opt.value === value) || options[0]
  
  const sizeClasses = {
    sm: {
      button: 'px-2 py-1 text-xs',
      options: 'py-2 pl-8 pr-4 text-xs',
      icon: 'h-3 w-3 opacity-60',
      checkIcon: 'h-3 w-3',
      checkIconPadding: 'pl-2',
      buttonPadding: 'pr-4'
    },
    md: {
      button: 'py-2 pl-3 pr-10',
      options: 'py-2 pl-10 pr-4',
      icon: 'h-5 w-5 text-slate-400',
      checkIcon: 'h-5 w-5',
      checkIconPadding: 'pl-3',
      buttonPadding: 'pr-10'
    }
  }

  const classes = sizeClasses[size]

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={`relative ${className}`}>
        <Listbox.Button 
          className={`relative cursor-pointer rounded font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${classes.button} ${selectedOption?.color || 'bg-slate-700 text-slate-200'}`}
        >
          <span className={`block truncate ${classes.buttonPadding}`}>
            {selectedOption?.label || 'Unknown'}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
            <ChevronUpDownIcon className={classes.icon} aria-hidden="true" />
          </span>
        </Listbox.Button>
        
        <Listbox.Options className="absolute z-50 mt-1 max-h-40 min-w-32 overflow-auto rounded-md bg-slate-800 border border-slate-600 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {options.map((option) => (
            <Listbox.Option
              key={option.value}
              className={({ active }) =>
                `relative cursor-pointer select-none ${classes.options} ${
                  active ? 'bg-slate-700 text-slate-100' : 'text-slate-200'
                }`
              }
              value={option.value}
            >
              {({ selected }) => (
                <>
                  <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                    {option.label}
                  </span>
                  {selected && (
                    <span className={`absolute inset-y-0 left-0 flex items-center text-orange-400 ${classes.checkIconPadding}`}>
                      <CheckIcon className={classes.checkIcon} aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}