import { Link } from 'react-router-dom'
import { IconPalette, IconCalculator, IconArrowRight } from '@tabler/icons-react'

export default function Home() {
  const tools = [
    {
      path: '/design-library',
      title: 'Design Library',
      description: 'Browse available 3D print designs with detailed filament requirements and print specifications.',
      icon: IconPalette,
      color: '#206bc4'
    },
    {
      path: '/filament-calculator',
      title: 'Filament Calculator',
      description: 'Track your filament inventory and calculate material needs before starting a print.',
      icon: IconCalculator,
      color: '#2fb344'
    }
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold mb-2">N3D API Examples</h1>
        <p className="text-[var(--text-secondary)]">
          Select which example you want to view below:
        </p>
      </div>

      <div className="grid gap-4">
        {tools.map(tool => (
          <Link
            key={tool.path}
            to={tool.path}
            className="
              block p-5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]
              hover:border-[var(--accent)] transition-colors group
            "
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tool.color}20` }}
              >
                <tool.icon size={20} stroke={1.5} style={{ color: tool.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-medium">{tool.title}</h2>
                  <IconArrowRight
                    size={16}
                    className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
