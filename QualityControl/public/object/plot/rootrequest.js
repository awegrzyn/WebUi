/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

/* global JSROOT */

import {h} from '/js/src/index.js';

/**
 * Plo
 * @param {Object} model 
 */
export default (model) => {
  // var filename = "http://localhost:8083/qc/DAQ/MO/daqTask/inputRecordSize/1605307363188";
  var filename = "https://qcg-test.cern.ch/test";
  JSROOT.NewHttpRequest(filename, 'object', function(obj) {
    console.log(obj);
    console.log("obj");
    JSROOT.draw("drawing", obj, "lego");
  }).send();

  return h('',{id: 'drawing'}, 'ceva')
};