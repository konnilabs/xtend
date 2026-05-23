const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  runXAlertComponentSuite
} = require('./xalert.component_suite');
const {
  runXToastComponentSuite
} = require('./xtoast.component_suite');
const {
  runXModalComponentSuite
} = require('./xmodal.component_suite');
const {
  runXRouterComponentSuite
} = require('./xrouter.component_suite');
const {
  runXLinkComponentSuite
} = require('./xlink.component_suite');
const {
  runXInputComponentSuite
} = require('./xinput.component_suite');
const {
  runXSelectComponentSuite
} = require('./xselect.component_suite');
const {
  runXCheckboxComponentSuite
} = require('./xcheckbox.component_suite');
const {
  runXRadioComponentSuite
} = require('./xradio.component_suite');
const {
  runXTextareaComponentSuite
} = require('./xtextarea.component_suite');
const {
  runXStatusComponentSuite
} = require('./xstatus.component_suite');
const {
  runXProgressComponentSuite
} = require('./xprogress.component_suite');
const {
  runXTooltipComponentSuite
} = require('./xtooltip.component_suite');
const {
  runXPopoverComponentSuite
} = require('./xpopover.component_suite');
const {
  runXDrawerComponentSuite
} = require('./xdrawer.component_suite');
const {
  runXFormComponentSuite
} = require('./xform.component_suite');
const {
  runXTabsComponentSuite
} = require('./xtabs.component_suite');
const {
  runXDialogComponentSuite
} = require('./xdialog.component_suite');
const {
  runXLightboxComponentSuite
} = require('./xlightbox.component_suite');
const {
  runXCalendarComponentSuite
} = require('./xcalendar.component_suite');
const {
  runXWriterComponentSuite
} = require('./xwriter.component_suite');
const {
  runXThemeComponentSuite
} = require('./xtheme.component_suite');
const {
  runXButtonComponentSuite
} = require('./xbutton.component_suite');
const {
  runXIconComponentSuite
} = require('./xicon.component_suite');
const {
  runXSpinnerComponentSuite
} = require('./xspinner.component_suite');
const {
  runXMenuComponentSuite
} = require('./xmenu.component_suite');
const {
  runXSummaryComponentSuite
} = require('./xsummary.component_suite');
const {
  runXPlayerComponentSuite
} = require('./xplayer.component_suite');
const {
  runXSectionComponentSuite
} = require('./xsection.component_suite');
const {
  runXCardsComponentSuite
} = require('./xcards.component_suite');
const {
  runXHeaderComponentSuite
} = require('./xheader.component_suite');
const {
  runXFooterComponentSuite
} = require('./xfooter.component_suite');
const {
  runXHeroComponentSuite
} = require('./xhero.component_suite');
const {
  runXTypeComponentSuite
} = require('./xtype.component_suite');
const {
  runXCodeComponentSuite
} = require('./xcode.component_suite');
const {
  runXMasonryComponentSuite
} = require('./xmasonry.component_suite');
const {
  runXRmtLifecycleDemoBuildComponentSuite
} = require('./x-rmt-lifecycle-demo-build.component_suite');
const {
  runXStateComponentSuite
} = require('./xstate.component_suite');
const {
  runXUtilsComponentSuite
} = require('./xutils.component_suite');
const {
  runXSurfacePortalComponentSuite
} = require('./xsurfaceportal.component_suite');
const {
  runXSurfaceRegionComponentSuite
} = require('./xsurfaceregion.component_suite');
const {
  runComponentPublicTypesSuite
} = require('./component_public_types_suite');

const componentSuites = [
  runXAlertComponentSuite,
  runXToastComponentSuite,
  runXModalComponentSuite,
  runXRouterComponentSuite,
  runXLinkComponentSuite,
  runXInputComponentSuite,
  runXSelectComponentSuite,
  runXCheckboxComponentSuite,
  runXRadioComponentSuite,
  runXTextareaComponentSuite,
  runXStatusComponentSuite,
  runXProgressComponentSuite,
  runXTooltipComponentSuite,
  runXPopoverComponentSuite,
  runXDrawerComponentSuite,
  runXFormComponentSuite,
  runXTabsComponentSuite,
  runXDialogComponentSuite,
  runXLightboxComponentSuite,
  runXCalendarComponentSuite,
  runXWriterComponentSuite,
  runXThemeComponentSuite,
  runXButtonComponentSuite,
  runXIconComponentSuite,
  runXSpinnerComponentSuite,
  runXMenuComponentSuite,
  runXSummaryComponentSuite,
  runXPlayerComponentSuite,
  runXSectionComponentSuite,
  runXCardsComponentSuite,
  runXHeaderComponentSuite,
  runXFooterComponentSuite,
  runXHeroComponentSuite,
  runXTypeComponentSuite,
  runXCodeComponentSuite,
  runXMasonryComponentSuite,
  runXRmtLifecycleDemoBuildComponentSuite,
  runXStateComponentSuite,
  runXUtilsComponentSuite,
  runXSurfacePortalComponentSuite,
  runXSurfaceRegionComponentSuite,
  runComponentPublicTypesSuite
];

function runComponentSuites(options = {}) {
  const context = createSuiteContext({
    id: 'components',
    label: 'Component-level contract suites'
  });

  const results = componentSuites.map((runSuite) => runSuite(options));

  results.forEach((result) => {
    result.passes.forEach((entry) => context.pass(`[${result.tag}] ${entry}`));
    result.failures.forEach((entry) => context.fail(`[${result.tag}] ${entry}`));
    if (Array.isArray(result.skips)) {
      result.skips.forEach((entry) => context.skip(`[${result.tag}] ${entry}`));
    }
  });

  return context.result({ results });
}

function printComponentSuitesReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Component-Level Contract Suites erfolgreich.',
    failureTitle: 'XTend Component-Level Contract Suites fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runComponentSuites();
  printComponentSuitesReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printComponentSuitesReport,
  runComponentSuites
};
