import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
import {
  applySnapshotService,
  beginSettingsResetService,
  bootstrapService,
  cancelGenerationService,
  cancelSettingsResetService,
  closeDeleteConversationService,
  closeSettingsService,
  confirmDeleteConversationService,
  confirmSettingsResetService,
  copyAssistantMessageService,
  newConversationService,
  openConversationMenuService,
  openSettingsService,
  readRuntimeDiagnosticsService,
  regenerateAssistantMessageService,
  requestDeleteConversationService,
  routePromptCommandService,
  saveSettingsService,
  selectConversationService,
  selectSettingsTabService,
  sendPromptService,
  streamGenerationService,
  updateConversationSearchService,
  updatePromptService,
  updateSettingsInstructionsService,
  updateSettingsThemeService
} from './renderer/app-controller.mjs';

export default defineAppServices({
  'xtend.llm.bootstrap': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: bootstrapService
  }),
  'xtend.llm.applySnapshot': service({
    kind: 'query',
    target: 'local',
    concurrency: 'latest',
    invoke: applySnapshotService
  }),
  'xtend.llm.updatePrompt': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: updatePromptService
  }),
  'xtend.llm.routePromptCommand': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: routePromptCommandService
  }),
  'xtend.llm.updateConversationSearch': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: updateConversationSearchService
  }),
  'xtend.llm.send': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: sendPromptService
  }),
  'xtend.llm.retryGeneration': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: sendPromptService
  }),
  'xtend.llm.copyAssistantMessage': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: copyAssistantMessageService
  }),
  'xtend.llm.regenerateAssistantMessage': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: regenerateAssistantMessageService
  }),
  'xtend.llm.cancelGeneration': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: cancelGenerationService
  }),
  'xtend.llm.generationStream': service({
    kind: 'stream',
    target: 'local',
    concurrency: 'latest',
    stream: streamGenerationService
  }),
  'xtend.llm.newConversation': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: newConversationService
  }),
  'xtend.llm.selectConversation': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: selectConversationService
  }),
  'xtend.llm.openConversationMenu': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: openConversationMenuService
  }),
  'xtend.llm.requestDeleteConversation': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: requestDeleteConversationService
  }),
  'xtend.llm.closeDeleteConversation': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: closeDeleteConversationService
  }),
  'xtend.llm.confirmDeleteConversation': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: confirmDeleteConversationService
  }),
  'xtend.llm.openSettings': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: openSettingsService
  }),
  'xtend.llm.closeSettings': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: closeSettingsService
  }),
  'xtend.llm.selectSettingsTab': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: selectSettingsTabService
  }),
  'xtend.llm.updateSettingsTheme': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: updateSettingsThemeService
  }),
  'xtend.llm.updateSettingsInstructions': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: updateSettingsInstructionsService
  }),
  'xtend.llm.saveSettings': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: saveSettingsService
  }),
  'xtend.llm.beginSettingsReset': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: beginSettingsResetService
  }),
  'xtend.llm.cancelSettingsReset': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: cancelSettingsResetService
  }),
  'xtend.llm.confirmSettingsReset': service({
    kind: 'command',
    target: 'local',
    concurrency: 'serial',
    invoke: confirmSettingsResetService
  }),
  'xtend.llm.readRuntimeDiagnostics': service({
    kind: 'query',
    target: 'local',
    concurrency: 'latest',
    invoke: readRuntimeDiagnosticsService
  })
});
