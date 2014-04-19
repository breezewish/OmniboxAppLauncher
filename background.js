/*!
 *
 * Original ported from: https://github.com/joshaven/string_score
 * 
 * string_score.js: String Scoring Algorithm 0.1.20 
 *
 * http://joshaven.com/string_score
 * https://github.com/joshaven/string_score
 *
 * Copyright (C) 2009-2011 Joshaven Potter <yourtech@gmail.com>
 * Special thanks to all of the contributors listed here https://github.com/joshaven/string_score
 * MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Tue Mar 1 2011
 * Updated: Tue Jun 11 2013
*/

function string_score(string, word, fuzziness) {

  // If the string is equal to the word, perfect match.
  if (string == word) return 1;

  //if it's not a perfect match and is empty return 0
  if( word == "") return 0;

  var runningScore = 0,
      charScore,
      finalScore,
      lString = string.toLowerCase(),
      strLength = string.length,
      lWord = word.toLowerCase(),
      wordLength = word.length,
      idxOf,
      startAt = 0,
      fuzzies = 1,
      fuzzyFactor;
  
  // Cache fuzzyFactor for speed increase
  if (fuzziness) fuzzyFactor = 1 - fuzziness;

  // Walk through word and add up scores.
  // Code duplication occurs to prevent checking fuzziness inside for loop
  if (fuzziness) {
    for (var i = 0; i < wordLength; ++i) {

      // Find next first case-insensitive match of a character.
      idxOf = lString.indexOf(lWord[i], startAt);
      
      if (-1 === idxOf) {
        fuzzies += fuzzyFactor;
        continue;
      } else if (startAt === idxOf) {
        // Consecutive letter & start-of-string Bonus
        charScore = 0.7;
      } else {
        charScore = 0.1;

        // Acronym Bonus
        // Weighing Logic: Typing the first character of an acronym is as if you
        // preceded it with two perfect character matches.
        if (string[idxOf - 1] === ' ') charScore += 0.8;
      }
      
      // Same case bonus.
      if (string[idxOf] === word[i]) charScore += 0.1; 
      
      // Update scores and startAt position for next round of indexOf
      runningScore += charScore;
      startAt = idxOf + 1;
    }
  } else {
    for (var i = 0; i < wordLength; ++i) {
    
      idxOf = lString.indexOf(lWord[i], startAt);
      
      if (-1 === idxOf) {
        return 0;
      } else if (startAt === idxOf) {
        charScore = 0.7;
      } else {
        charScore = 0.1;
        if (string[idxOf - 1] === ' ') charScore += 0.8;
      }

      if (string[idxOf] === word[i]) charScore += 0.1; 
      
      runningScore += charScore;
      startAt = idxOf + 1;
    }
  }

  // Reduce penalty for longer strings.
  finalScore = 0.5 * (runningScore / strLength  + runningScore / wordLength) / fuzzies;
  
  if ((lWord[0] === lString[0]) && (finalScore < 0.85)) {
    finalScore += 0.15;
  }
  
  return finalScore;
}

/*!
 *
 * Original ported from: https://github.com/kpdecker/jsdiff
 * 
 * Text diff implementation.
 *
 * Software License Agreement (BSD License)
 * 
 * Copyright (c) 2009-2011, Kevin Decker kpdecker@gmail.com
 * All rights reserved.
 */
function clonePath(path) {
  return { newPos: path.newPos, components: path.components.slice(0) };
}
var Diff = function(ignoreWhitespace) {
  this.ignoreWhitespace = ignoreWhitespace;
};
Diff.prototype = {
  diff: function(oldString, newString) {
    // Handle the identity case (this is due to unrolling editLength == 0
    if (newString === oldString) {
      return [{ value: newString }];
    }
    if (!newString) {
      return [{ value: oldString, removed: true }];
    }
    if (!oldString) {
      return [{ value: newString, added: true }];
    }

    newString = this.tokenize(newString);
    oldString = this.tokenize(oldString);

    var newLen = newString.length, oldLen = oldString.length;
    var maxEditLength = newLen + oldLen;
    var bestPath = [{ newPos: -1, components: [] }];

    // Seed editLength = 0
    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
    if (bestPath[0].newPos+1 >= newLen && oldPos+1 >= oldLen) {
      return bestPath[0].components;
    }

    for (var editLength = 1; editLength <= maxEditLength; editLength++) {
      for (var diagonalPath = -1*editLength; diagonalPath <= editLength; diagonalPath+=2) {
        var basePath;
        var addPath = bestPath[diagonalPath-1],
            removePath = bestPath[diagonalPath+1];
        oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
        if (addPath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath-1] = undefined;
        }

        var canAdd = addPath && addPath.newPos+1 < newLen;
        var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = undefined;
          continue;
        }

        // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the new string is the farthest from the origin
        // and does not pass the bounds of the diff graph
        if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
          basePath = clonePath(removePath);
          this.pushComponent(basePath.components, oldString[oldPos], undefined, true);
        } else {
          basePath = clonePath(addPath);
          basePath.newPos++;
          this.pushComponent(basePath.components, newString[basePath.newPos], true, undefined);
        }

        var oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);

        if (basePath.newPos+1 >= newLen && oldPos+1 >= oldLen) {
          return basePath.components;
        } else {
          bestPath[diagonalPath] = basePath;
        }
      }
    }
  },

  pushComponent: function(components, value, added, removed) {
    var last = components[components.length-1];
    if (last && last.added === added && last.removed === removed) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      components[components.length-1] =
        {value: this.join(last.value, value), added: added, removed: removed };
    } else {
      components.push({value: value, added: added, removed: removed });
    }
  },
  extractCommon: function(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath;
    while (newPos+1 < newLen && oldPos+1 < oldLen && this.equals(newString[newPos+1], oldString[oldPos+1])) {
      newPos++;
      oldPos++;

      this.pushComponent(basePath.components, newString[newPos], undefined, undefined);
    }
    basePath.newPos = newPos;
    return oldPos;
  },

  equals: function(left, right) {
    var reWhitespace = /\S/;
    if (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right)) {
      return true;
    } else {
      return left === right;
    }
  },
  join: function(left, right) {
    return left + right;
  },
  tokenize: function(value) {
    return value;
  }
};

var CharDiff = new Diff();

/*!

Omnibox App Launcher

The MIT License (MIT)

Copyright (c) 2014 Breezewish

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

var LOCALSTORAGE_PREFIX = 'OMNIBOX_APP_LAUNCHER_';

var apps = [];
var study_data = {};

var lastInput = null, lastMatchedApp = null;

function setup() {
    updateAppList();
    study_data = storageGet('study_data', {});
    chrome.omnibox.onInputStarted.addListener(onInputStarted);
    chrome.omnibox.onInputChanged.addListener(onInputChanged);
    chrome.omnibox.onInputEntered.addListener(onInputEntered);
}

function storageSet(key, value) {
    localStorage[LOCALSTORAGE_PREFIX + key] = JSON.stringify(value);
}

function storageGet(key, def) {
    var r = localStorage[LOCALSTORAGE_PREFIX + key];
    if (r === undefined) {
        return def;
    } else {
        return JSON.parse(r);
    }
}

function similarity(base, match) {
    var b = base.toLowerCase();
    var m = match.toLowerCase().trim();
    
    var score = string_score(b, m);

    if (m.length > 0) {
        try {
            // bonus for substring
            if (new RegExp('\\b' + escapeForRegExp(m)).test(b)) {
                score += 0.15;
            } else if (b.indexOf(m) > -1) {
                score += 0.1;
            }
        } catch(e) {}
    }

    return score;
}

function escape(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function omniboxDiff(base, match) {
    var b = escape(base);
    var m = escape(match);
    
    var diff = CharDiff.diff(b.toLowerCase(), m.toLowerCase());
    
    var ret = '', lastPos = 0;
    diff.forEach(function(part) {
        if (part.added) {
            // do nothing
        } else {
            var val = base.substr(lastPos, part.value.length);
            lastPos += part.value.length;

            if (part.removed) {
                ret += val;
            } else {
                ret += '<match>' + val + '</match>';
            }
        }
    });

    return ret;
}

function escapeForRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function updateAppList() {
    chrome.management.getAll(function(result) {
        var applist = [];

        result.forEach(function(extension) {
            if (!extension.enabled) {
                return;
            }

            if (extension.type === 'hosted_app'
                || extension.type === 'packaged_app'
                || extension.type === 'legacy_packaged_app'
            ) {
                applist.push(extension);
            }
        });

        apps = applist;
    });
}

function getMatchedAppScore(text, len, nameOnly) {
    var scores = [];

    text = text.toLowerCase();

    apps.forEach(function(app) {
        var score;
        var obj = { app: app };

        obj.score_name = similarity(app.name, text);

        if (nameOnly) {
            obj.score_desc = 0;
            obj.score = obj.score_name;
        } else {
            obj.score_desc = similarity(app.description, text) * 0.8;
            obj.score = Math.max(obj.score_name, obj.score_desc);
        }

        // add frequency statistics
        if (study_data[text] && study_data[text][app.id]) {
            obj.freq = study_data[text][app.id];
        } else {
            obj.freq = 0;
        }

        scores.push(obj);
    });

    scores.sort(function(s1, s2) {
        if (s1.freq !== s2.freq) {
            return s2.freq - s1.freq;
        } else {
            return s2.score - s1.score;
        }
    });

    if (len !== undefined && scores.length > len) {
        scores = scores.slice(0, len);
    }

    return scores;
}

function study(text, desiredApp) {
    if (study_data[text] === undefined) {
        study_data[text] = {};
    }
    if (study_data[text][desiredApp.id] === undefined) {
        study_data[text][desiredApp.id] = 0;
    }

    study_data[text][desiredApp.id]++;
    storageSet('study_data', study_data);
}

function clearStudy() {
    study_data = {};
    storageSet('study_data', study_data);
}

function onInputStarted() {
    updateAppList();
}

function onInputChanged(text, suggester) {
    lastInput = text;

    var suggestions = [];
    var appscore = getMatchedAppScore(text, 10);
    
    if (appscore.length > 0) {
        lastMatchedApp = appscore[0].app;

        // determine which part to highlight
        var desc = '<dim>Launch </dim> ';
        if (appscore[0].score_name > appscore[0].score_desc) {
            desc += omniboxDiff(lastMatchedApp.name, text) + '<dim> - ' + escape(lastMatchedApp.description) + '</dim>';
        } else {
            desc += escape(lastMatchedApp.name, text) + '<dim> - ' + omniboxDiff(lastMatchedApp.description, text) + '</dim>';
        }
        chrome.omnibox.setDefaultSuggestion({ description: desc });
        
        if (appscore.length > 1) {
            appscore.slice(1).forEach(function(score) {
                suggestions.push({
                    content:        escape(score.app.name),
                    description:    escape(score.app.name) + '<dim> - ' + escape(score.app.description) + '</dim>'
                });
            });
        }
    }
    suggester(suggestions);
}

function onInputEntered(text) {
    if (lastInput === text) {
        study(lastInput, lastMatchedApp);
        chrome.management.launchApp(lastMatchedApp.id);
    } else {
        // user selected a non-default item:
        // guess selection & study
        var appscore = getMatchedAppScore(text, 1, true);
        if (appscore.length > 0) {
            var desiredApp = applist[0].app;
            study(lastInput, desiredApp);
            chrome.management.launchApp(desiredApp.id);
        }
    }
}

setup();