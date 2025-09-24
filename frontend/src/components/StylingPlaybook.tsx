import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface StylingPlaybookProps {
  isOpen: boolean
  onClose: () => void
}

export function StylingPlaybook({ isOpen, onClose }: StylingPlaybookProps) {
  const [activeSection, setActiveSection] = useState('colors')

  if (!isOpen) return null

  const sampleMarkdown = `# Sample Heading 1
## Sample Heading 2  
### Sample Heading 3

This is **bold text** and this is *italic text*. Here's some regular paragraph text with good spacing and readability.

> This is a blockquote that shows how quotes are styled with the left border and background tint.

- List item one
- List item two with **bold** content
- List item three with *italic* content

\`inline code\` looks like this, and here's a [sample link](#) to show link styling.

---

Code blocks look like this:
\`\`\`
function example() {
  return "Hello World";
}
\`\`\`
`

  const colorSections = [
    {
      title: 'Primary Colors (Violet)',
      colors: [
        { name: 'violet-300', class: 'bg-violet-300', text: 'text-violet-300', usage: 'Main headings (H1)' },
        { name: 'violet-400', class: 'bg-violet-400', text: 'text-violet-400', usage: 'Section headings (H2/H3), links, list markers' },
        { name: 'violet-500', class: 'bg-violet-500', text: 'text-violet-500', usage: 'Blockquote borders, focus rings' }
      ]
    },
    {
      title: 'Secondary Colors (Orange)',
      colors: [
        { name: 'orange-300', class: 'bg-orange-300', text: 'text-orange-300', usage: 'Emphasis text (italic), inline code' },
        { name: 'orange-400', class: 'bg-orange-400', text: 'text-orange-400', usage: 'Primary action buttons, key highlights' },
        { name: 'orange-500', class: 'bg-orange-500', text: 'text-orange-500', usage: 'Focus rings, hover states' },
        { name: 'orange-600', class: 'bg-orange-600', text: 'text-orange-600', usage: 'Button backgrounds' }
      ]
    },
    {
      title: 'Base Colors (Slate)',
      colors: [
        { name: 'slate-100', class: 'bg-slate-100', text: 'text-slate-100', usage: 'Primary text on dark backgrounds' },
        { name: 'slate-200', class: 'bg-slate-200', text: 'text-slate-200', usage: 'Body text, readable content' },
        { name: 'slate-300', class: 'bg-slate-300', text: 'text-slate-300', usage: 'Muted text, blockquotes' },
        { name: 'slate-400', class: 'bg-slate-400', text: 'text-slate-400', usage: 'Placeholder text, secondary info' },
        { name: 'slate-600', class: 'bg-slate-600', text: 'text-slate-600', usage: 'Borders, dividers' },
        { name: 'slate-700', class: 'bg-slate-700', text: 'text-slate-700', usage: 'Input backgrounds, cards' },
        { name: 'slate-800', class: 'bg-slate-800', text: 'text-slate-800', usage: 'Main backgrounds, containers' },
        { name: 'slate-900', class: 'bg-slate-900', text: 'text-slate-900', usage: 'Deep backgrounds' }
      ]
    },
    {
      title: 'Status Colors',
      colors: [
        { name: 'green-200/900', class: 'bg-green-900', text: 'text-green-200', usage: 'Completed status' },
        { name: 'yellow-200/900', class: 'bg-yellow-900', text: 'text-yellow-200', usage: 'Draft/in-progress status' },
        { name: 'red-200/900', class: 'bg-red-900', text: 'text-red-200', usage: 'Not started/error status' },
        { name: 'blue-200/900', class: 'bg-blue-900', text: 'text-blue-200', usage: 'Information, read-only indicators' },
        { name: 'purple-200/900', class: 'bg-purple-900', text: 'text-purple-200', usage: 'Special source indicators' }
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h1 className="text-2xl font-bold text-violet-400">Design System Playbook</h1>
            <p className="text-slate-400 mt-1">Color palette, components, and styling guidelines</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-slate-800/50 border-r border-slate-700 p-4">
            <nav className="space-y-2">
              {[
                { id: 'colors', label: 'Color Palette', icon: '🎨' },
                { id: 'typography', label: 'Typography', icon: '📝' },
                { id: 'components', label: 'Components', icon: '🧩' },
                { id: 'markdown', label: 'Markdown Styles', icon: '📄' }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                    activeSection === section.id
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeSection === 'colors' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-violet-400 mb-4">Color Palette</h2>
                  <p className="text-slate-300 mb-6">
                    Our design system uses a violet-primary, orange-secondary palette with slate base colors.
                  </p>
                </div>

                {colorSections.map((section) => (
                  <div key={section.title} className="space-y-4">
                    <h3 className="text-lg font-medium text-orange-400">{section.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.colors.map((color) => (
                        <div key={color.name} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center gap-4 mb-2">
                            <div className={`w-12 h-12 rounded-lg ${color.class} border border-slate-600`}></div>
                            <div>
                              <div className="font-mono text-sm text-slate-200">{color.name}</div>
                              <div className={`font-mono text-xs ${color.text}`}>Sample Text</div>
                            </div>
                          </div>
                          <div className="text-sm text-slate-400">{color.usage}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'typography' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-violet-400 mb-4">Typography Scale</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <h1 className="text-3xl font-bold text-violet-300 mb-2">Heading 1 - 3xl</h1>
                    <code className="text-xs text-orange-300">text-3xl font-bold text-violet-300</code>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <h2 className="text-2xl font-semibold text-violet-400 mb-2">Heading 2 - 2xl</h2>
                    <code className="text-xs text-orange-300">text-2xl font-semibold text-violet-400</code>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <h3 className="text-xl font-medium text-violet-400 mb-2">Heading 3 - xl</h3>
                    <code className="text-xs text-orange-300">text-xl font-medium text-violet-400</code>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-200 leading-relaxed mb-2">Body text with comfortable line height for readability</p>
                    <code className="text-xs text-orange-300">text-slate-200 leading-relaxed</code>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">Secondary text for less important information</p>
                    <code className="text-xs text-orange-300">text-slate-400 text-sm</code>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'components' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-violet-400 mb-4">UI Components</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-orange-400 mb-3">Buttons</h3>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                        Primary Button
                      </button>
                      <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                        Secondary Button
                      </button>
                      <button className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600">
                        Tertiary Button
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-orange-400 mb-3">Status Badges</h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="px-3 py-1 bg-green-900 text-green-200 rounded-full text-sm font-medium">Completed</span>
                      <span className="px-3 py-1 bg-yellow-900 text-yellow-200 rounded-full text-sm font-medium">Draft</span>
                      <span className="px-3 py-1 bg-red-900 text-red-200 rounded-full text-sm font-medium">Not Started</span>
                      <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm font-medium">Info</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-orange-400 mb-3">Input Fields</h3>
                    <div className="space-y-3 max-w-md">
                      <input
                        type="text"
                        placeholder="Text input with focus ring"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <textarea
                        placeholder="Textarea with matching styles"
                        className="w-full h-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'markdown' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-violet-400 mb-4">Markdown Styling</h2>
                  <p className="text-slate-300 mb-6">
                    This shows how markdown content is styled in read-only views.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-orange-400 mb-3">Rendered Output</h3>
                    <div className="bg-slate-800/40 border border-slate-600 rounded p-4 prose prose-invert max-w-none
                      prose-headings:text-violet-400 prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-2xl prose-h1:mb-6 prose-h1:text-violet-300
                      prose-h2:text-xl prose-h2:mb-4 prose-h2:text-violet-400 prose-h2:border-b prose-h2:border-slate-700 prose-h2:pb-2
                      prose-h3:text-lg prose-h3:mb-3 prose-h3:text-violet-400
                      prose-p:text-slate-200 prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-violet-300 prose-strong:font-semibold
                      prose-em:text-orange-300 prose-em:italic
                      prose-ul:text-slate-200 prose-ol:text-slate-200 prose-ul:space-y-2 prose-ol:space-y-2
                      prose-li:text-slate-200 prose-li:leading-relaxed prose-li:marker:text-violet-400
                      prose-blockquote:border-l-violet-500 prose-blockquote:border-l-4 
                      prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:text-slate-300 prose-blockquote:italic prose-blockquote:bg-violet-500/5
                      prose-code:bg-slate-700 prose-code:text-orange-300 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                      prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-600 prose-pre:p-4 prose-pre:rounded-lg
                      prose-hr:border-slate-600 prose-hr:my-8
                      prose-a:text-violet-400 prose-a:underline prose-a:decoration-violet-400/50 hover:prose-a:decoration-violet-400">
                      <ReactMarkdown>
                        {sampleMarkdown}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-orange-400 mb-3">CSS Classes</h3>
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
{`prose prose-invert max-w-none
prose-headings:text-violet-400
prose-h1:text-violet-300
prose-h2:text-violet-400 prose-h2:border-b prose-h2:border-slate-700
prose-strong:text-violet-300
prose-em:text-orange-300
prose-code:text-orange-300
prose-blockquote:border-l-violet-500 prose-blockquote:bg-violet-500/5
prose-a:text-violet-400`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Attribution */}
        <div className="border-t border-slate-700 px-6 py-3 bg-slate-800/30">
          <p className="text-xs text-slate-400 text-center">
            Icons: <a
              href="https://www.flaticon.com/free-icons/tarot"
              title="tarot icons"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline decoration-violet-400/50 hover:decoration-violet-300"
            >
              Tarot icons created by Heykiyou - Flaticon
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}