import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'

export interface ListboxOption {
  value: string
  label: string
}

interface StyledListboxProps {
  value: string
  onChange: (value: string) => void
  options: ListboxOption[]
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function StyledListbox({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select option...",
  className = "",
  size = 'md',
  disabled = false
}: StyledListboxProps) {
  const selectedOption = options.find(opt => opt.value === value) || options[0]
  
  const sizeClasses = {
    sm: {
      button: 'px-2 py-1 text-xs',
      options: 'py-2 pl-8 pr-4 text-xs',
      icon: 'h-3 w-3',
      checkIcon: 'h-3 w-3',
      checkIconPadding: 'pl-2'
    },
    md: {
      button: 'py-2 pl-3 pr-10',
      options: 'py-2 pl-10 pr-4',
      icon: 'h-5 w-5',
      checkIcon: 'h-5 w-5',
      checkIconPadding: 'pl-3'
    },
    lg: {
      button: 'py-3 pl-4 pr-12',
      options: 'py-3 pl-12 pr-6',
      icon: 'h-6 w-6',
      checkIcon: 'h-6 w-6',
      checkIconPadding: 'pl-4'
    }
  }

  const classes = sizeClasses[size]

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={`relative ${className}`}>
        <Listbox.Button 
          className={`relative w-full cursor-default rounded-md bg-slate-700 border border-slate-600 text-left text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${classes.button}`}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronUpDownIcon className={`text-slate-400 ${classes.icon}`} aria-hidden="true" />
          </span>
        </Listbox.Button>
        
        <Listbox.Options className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 border border-slate-600 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {options.map((option) => (
            <Listbox.Option
              key={option.value}
              className={({ active }) =>
                `relative cursor-default select-none ${classes.options} ${
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