'use strict'
const TABS = [
  { id: 'get-started', path: '/get-started/', title: 'Get Started' },
  { id: 'administration', path: '/administration/', title: 'Administration' },
  { id: 'cypher', path: '/cypher/', title: 'Cypher' },
  { id: 'genai', path: '/genai/', title: 'GenAI & Analytics' },
  { id: 'tools', path: '/tools/', title: 'Tools' },
  { id: 'drivers-apis', path: '/drivers-apis/', title: 'Drivers & APIs' },
  { id: 'reference', path: '/reference/', title: 'Reference' },
  { id: 'learn', path: '/learn/', title: 'Learn more' },
  { id: 'unassigned', path: '/unassigned/', title: 'Unassigned', debug: true },
]
const helper = () => TABS
helper.TABS = TABS
module.exports = helper
