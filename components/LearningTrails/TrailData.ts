import { LearningTrail, TrailCategory } from './types';

export const TRAIL_DATA: Record<TrailCategory, LearningTrail> = {
  Programming: {
    id: 'Programming',
    title: 'Trilha de Programação',
    description: 'Evolução em lógica, sistemas de controle, visão computacional e automação.',
    stages: [
      {
        id: 'prog_iniciante',
        level: 'Iniciante',
        competencies: [
          {
            id: 'comp_prog_1',
            title: 'Fundamentos de Java e Lógica',
            description: 'Compreensão de variáveis, loops, condicionais e orientação a objetos básica.',
            pillar: 'Desenvolvimento Autônomo',
            evaluationMethod: 'Criação de scripts básicos e aprovação em mini-teste.',
            xpReward: 50
          },
          {
            id: 'comp_prog_2',
            title: 'TeleOp Básico',
            description: 'Configuração do Gamepad para controlar o Drive Train.',
            pillar: 'Aprendizagem Coletiva',
            evaluationMethod: 'Demonstração do robô movendo na arena com o controle.',
            xpReward: 80
          }
        ]
      },
      {
        id: 'prog_intermediario',
        level: 'Intermediário',
        competencies: [
          {
            id: 'comp_prog_3',
            title: 'Odometria e Autônomo Básico',
            description: 'Implementação de Dead Wheels e caminhos pré-programados usando RoadRunner.',
            pillar: 'Mentoria Estratégica',
            evaluationMethod: 'Robô completando um trajeto de 3 pontos no modo Autônomo de forma consistente.',
            xpReward: 150
          }
        ]
      }
    ]
  },
  Engineering: {
    id: 'Engineering',
    title: 'Trilha de Engenharia Mecânica',
    description: 'Construção, prototipagem e integração de sistemas mecânicos eficientes.',
    stages: [
      {
        id: 'eng_iniciante',
        level: 'Iniciante',
        competencies: [
          {
            id: 'comp_eng_1',
            title: 'Máquinas Simples e Ferramentas',
            description: 'Uso seguro de ferramentas e entendimento de engrenagens e redução.',
            pillar: 'Desenvolvimento Autônomo',
            evaluationMethod: 'Montagem de uma caixa de redução simples funcional.',
            xpReward: 50
          }
        ]
      },
      {
        id: 'eng_intermediario',
        level: 'Intermediário',
        competencies: [
          {
            id: 'comp_eng_2',
            title: 'Sistemas de Intake e Elevadores',
            description: 'Construção de mecanismos de coleta e elevação.',
            pillar: 'Aprendizagem Coletiva',
            evaluationMethod: 'Apresentação de um protótipo capaz de coletar o elemento do jogo.',
            xpReward: 120
          }
        ]
      }
    ]
  },
  CAD: {
    id: 'CAD',
    title: 'Trilha de Modelagem 3D (CAD)',
    description: 'Design e modelagem de peças, assemblies e preparação para impressão 3D.',
    stages: [
      {
        id: 'cad_iniciante',
        level: 'Iniciante',
        competencies: [
          {
            id: 'comp_cad_1',
            title: 'Esboços 2D e Extrusão',
            description: 'Criação de sketches com restrições e extrusões básicas.',
            pillar: 'Desenvolvimento Autônomo',
            evaluationMethod: 'Modelagem de uma peça personalizada.',
            xpReward: 50
          }
        ]
      },
      {
        id: 'cad_intermediario',
        level: 'Intermediário',
        competencies: [
          {
            id: 'comp_cad_2',
            title: 'Assemblies Complexos',
            description: 'Montagem do robô em CAD garantindo que não existam colisões físicas.',
            pillar: 'Mentoria Estratégica',
            evaluationMethod: 'Apresentação do subsistema renderizado no software de CAD.',
            xpReward: 150
          }
        ]
      }
    ]
  },
  Management: {
    id: 'Management',
    title: 'Trilha de Gestão e Planejamento',
    description: 'Liderança, organização de ciclos ágeis, gestão financeira e B-LEED.',
    stages: [
      {
        id: 'mng_iniciante',
        level: 'Iniciante',
        competencies: [
          {
            id: 'comp_mng_1',
            title: 'Metodologia B-LEED e 5W2H',
            description: 'Entendimento profundo do método de gestão da equipe e criação de planos.',
            pillar: 'Desenvolvimento Autônomo',
            evaluationMethod: 'Criação de 3 planos 5W2H coerentes e bem estruturados.',
            xpReward: 60
          }
        ]
      },
      {
        id: 'mng_intermediario',
        level: 'Intermediário',
        competencies: [
          {
            id: 'comp_mng_2',
            title: 'Gestão Financeira e Patrocínios',
            description: 'Elaboração de orçamento e estratégias para captação de recursos.',
            pillar: 'Mentoria Estratégica',
            evaluationMethod: 'Apresentação da planilha de custos e pitch de patrocínio simulado.',
            xpReward: 140
          }
        ]
      }
    ]
  },
  Marketing: {
    id: 'Marketing',
    title: 'Trilha de Marketing e Outreach',
    description: 'Design visual, gestão de redes, contato com a comunidade e criação de impacto.',
    stages: [
      {
        id: 'mkt_iniciante',
        level: 'Iniciante',
        competencies: [
          {
            id: 'comp_mkt_1',
            title: 'Identidade Visual e Redes',
            description: 'Manutenção da marca Bazinga e criação de posts informativos.',
            pillar: 'Desenvolvimento Autônomo',
            evaluationMethod: 'Planejamento e publicação de uma semana de cronograma no Instagram.',
            xpReward: 70
          }
        ]
      },
      {
        id: 'mkt_intermediario',
        level: 'Intermediário',
        competencies: [
          {
            id: 'comp_mkt_2',
            title: 'Impacto Social (Outreach)',
            description: 'Planejamento de eventos que inspiram a comunidade com STEM.',
            pillar: 'Aprendizagem Coletiva',
            evaluationMethod: 'Organização documentada de um evento social em escola pública.',
            xpReward: 160
          }
        ]
      }
    ]
  }
};
