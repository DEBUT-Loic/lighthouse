/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const makeComputedArtifact = require('../computed-artifact.js');
const MetricArtifact = require('./metric.js');
const LHError = require('../../lib/lh-error.js');

class LayoutStability extends MetricArtifact {
  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} _
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  static computeSimulatedMetric(data, _) {
    // @ts-ignore There's no difference between Simulated and Observed for CLS
    return LayoutStability.computeObservedMetric(data);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @return {Promise<LH.Artifacts.Metric>}
   */
  static computeObservedMetric(data) {
    const layoutShiftEvts = data.traceOfTab.mainThreadEvents
      .filter(evt => evt.name === 'LayoutShift')
      .filter(e => e.args && e.args.data && e.args.data.is_main_frame);

    // tdresser sez: In about 10% of cases, layout instability is 0, and there will be no trace events.
    // TODO: Validate that. http://crbug.com/1003459
    if (layoutShiftEvts.length === 0) {
      return Promise.resolve({
        timing: 0,
      });
    }

    const finalLayoutShift = layoutShiftEvts.slice(-1)[0];
    const layoutStabilityScore =
      finalLayoutShift.args &&
      finalLayoutShift.args.data &&
      finalLayoutShift.args.data.cumulative_score;

    if (layoutStabilityScore === undefined) throw new LHError(LHError.errors.NO_LAYOUT_SHIFT);

    return Promise.resolve({
      timing: layoutStabilityScore,
    });
  }
}

module.exports = makeComputedArtifact(LayoutStability);