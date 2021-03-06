const User = require('./models/user.js');
const Capsule = require('./models/capsule.js');

exports.parseDate = ([years, months, days]) => {
  let today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth() + 1;
  let currentDay = today.getDate();

  let unearthYear = currentYear + years;
  let unearthMonth = currentMonth + months;
  let unearthDay = currentDay + days;

  return new Date([unearthYear, unearthMonth, unearthDay]);
};

exports.signup = (req, res) => {
  let newUser = User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  });
  // the password will be hashed in the user file before save gets called
  newUser.save((err, user) => {
    if (err) {
      console.error(err);
      res.sendStatus(404);
    } else {
      console.log('New user created');
      req.session.user = user;
      console.log(req.session.user);
      res.sendStatus(201);
    }
  });
};

exports.signin = (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) {
      console.error(`ERROR: ${err}`);
      res.sendStatus(404);
    } else if (!user) {
      console.log(`Could not find user with email ${req.body.email}`);
      res.sendStatus(404);
    } else {
      user.comparePassword(req.body.password, (err, matches) => {
        if (err) {
          console.error(`Signin error: ${err}`)
          res.sendStatus(404);
        } else if (!matches) {
          console.log('Password did not match');
          res.sendStatus(404);
        } else {
          console.log(`Successful user signin for email ${req.body.email}`);
          req.session.user = user;
          console.log('proof that a session has been editted and a new pro was added:', req.session);
          res.send(req.session.user);
        }
      });
    }
  });
  // res.send('5993447ada1e1a8c9114be47');   ////********   Put your ID here
};

exports.addContact = (req, res) => {
  // console.log(req.body.email, req.body.contact);
  User.findOne({ email: req.body.email }, (err, user) => {
    // console.log('user found', user)
    user.contacts.push(req.body.contact);
    user.save();
    // console.log(user);
    res.sendStatus(201);
  })
}

exports.removeContact = (req, res) => {
  console.log(req.body.email, req.body.contact);
  User.findOne({ email: req.body.email }, (err, user)=> {
    if (err) {
      console.error(`Failed to remove contact ${req.body.contact.name} from the database`);
      res.sendStatus(504);
    } else {
      let newList = user.contacts.filter((contact)=>{
        return contact.name !== req.body.contact.name

      })
      console.log(newList);
      user.contacts = newList;
      user.save((err, user) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          console.log(`Successfully removed contact ${req.body.contact.name} from the database`);
          res.sendStatus(204);
        }
      });

    }
  })
}

exports.getContacts = (req, res) => {
  console.log(req.body.email, '------email');
  User.findOne({ email: req.body.email }, (err, user)=>{
    if (err) {
      console.error(`Failed to retrieve contacts from the database`);
      res.sendStatus(504);
    } else {
      res.status(200).send(user.contacts);
    }
  })
}

//need to update http
exports.getAllCapsules = (req, res) => {
  console.log('req body userId and email', req.body);


  Capsule.find({
    $or: [{ intendedRecipient: { $elemMatch: { email:req.body.email }}, buried: true }, { _user: req.body.userId }]},
    (err, capsules) => {
    if (err) {
      console.error(`All capsules retrieval error: ${err}`);
      res.sendStatus(404);
    } else if (!capsules) {
      console.log('Could not retrieve all capsules');
      res.sendStatus(404);
    } else {
      console.log(`Successfully retrieved all capsules for user ${req.body.userId}`);
      console.log(capsules);

      res.send(capsules);
    }
  });
};

exports.getBuriedCapsules = (req, res) => {
  Capsule.find({ _user: req.body.userId, buried: true }, (err, capsules) => {
    if (err) {
      console.error(`Buried capsules retrieval error: ${err}`);
      res.sendStatus(404);
    } else if (!capsules) {
      console.log('Could not retrieve buried capsules');
      res.sendStatus(404);
    } else {
      console.log(`Successfully retrieved buried capsules for user ${req.body.userId}`);
      res.send(capsules);
    }
  });
};

//expecting req.body.email
exports.getOtherCapsules = (req, res) => {
  Capsule.find({ intendedRecipient: { $elemMatch: { email:req.body.email }}, buried: true }, (err, capsules) => {
    if (err) {
      console.error(`Get other capsules by email retrieval error: ${err}`);
      res.sendStatus(404);
    } else if (!capsules) {
      console.log('There is no other capsules by emails');
      res.sendStatus(404);
    } else {
      console.log(`Successfully retrieved other capsules for user email${req.body.email}`);
      res.send(capsules);
    }
  });
}

//expecting req.body.sercret and req.body.userEmail
exports.getOtherCapsulesBySecret = (req, res) => {
  console.log('----------------------------------------------------------------------')
  console.log(req.body.secret, req.body.email)
  Capsule.update({"intendedRecipient.secret": req.body.secret}, {"$set": {"intendedRecipient.$.email" : req.body.email}}, {multi: true}, (err, capsules) => {
    if (err) {
      console.log('err', err)
      res.sendStatus(404);
    } else {
      console.log(`Successfully add user email ${req.body.email} as a recipient to this capsule`);
      res.send(capsules);
    }
  })
}
  // Capsule.find({ intendedRecipient: { $elemMatch: { secret:req.body.secret }}, buried: true }, (err, capsules) => {
  //   if (err) {
  //     console.error(`Get other capsules by secret retrieval error: ${err}`);
  //     res.sendStatus(404);
  //   } else if (!capsules) {
  //     console.log('There is no other capsules by secret');
  //     res.sendStatus(404);
  //   } else {
  //     console.log('Successfully retrieved other capsules from the sercret');
  //     let counter = 0;
  //     for (var capsule of capsules) {
  //       for (var contact of capsule.intendedRecipient) {
  //         if (contact.secret === req.body.secret) {
  //           contact.email = req.body.email;
  //           capsule.sav.e((err, user) => {
  //             if (err) {
  //               console.error(err);
  //               res.sendStatus(404);
  //             } else {
  //               counter ++;
  //               console.log(`Successfully add user email ${req.body.email} as a recipient to this capsule`);
  //               console.log('SUCCESS capsule', capsule);
  //               console.log('user', user);
  //             }
  //           })
  //         }
  //       }
  //       console.log('capsule outside loop', capsule);
  //     }
  //     console.log('count', counter)
  //     if (counter === capsules.length) {
  //       console.log('caaaaaaaaaps', capsules)
  //       res.send(capsules);
  //     }
  //   }
  // });


exports.inProgress = (req, res) => {
  Capsule.find({ _user: req.body.userId, buried: false }, (err, capsules) => {
    if (err) {
      console.error(`In progress capsules retrieval error: ${err}`);
      res.sendStatus(404);
    } else if (!capsules) {
      console.log('Could not retrieve in progress capsules');
      res.sendStatus(404);
    } else {
      console.log(`Successfully retrieved in progress capsules for user ${req.body.userId}`);
      res.send(capsules);
    }
  });
};

exports.createCapsule = (req, res) => {
  console.log(req.body, 'request body----');
  let newCapsule = Capsule({
    _user: req.body.userId,
    capsuleName: req.body.capsuleName,
    contents: [],
    buried: false,
    unearthed: false,
    unearthDate: null,
    createdAt: Date.now(),
    intendedRecipient: [],
    unearthMessage: ''
  });

  newCapsule.save((err) => {
    if (err) {
      console.error(`ERROR creating capsule in database: ${err}`)
    } else {
      console.log(`New empty capsule created for user ${req.body.userId}`);
      res.send(newCapsule._id);
    }
  });
}

exports.editCapsule = (req, res) => {
  let newName = req.body.capsuleName;
  let capsuleId = req.body.capsuleId;
  let newContents = req.body.capsuleContent;
  console.log('server capsuleId', capsuleId)
  Capsule.findOne({ _id: capsuleId }, (err, capsule) => {
    if (err) {
      console.error(`ERROR: ${err}`);
      res.sendStatus(404);
    } else if (!capsule) {
      console.log(`Could not find capsule with id ${capsuleId}`);
      res.sendStatus(404);
    } else {
      capsule.capsuleName = newName;
      capsule.contents = newContents;
      capsule.save((err) => {
        if (err) {
          console.error(`ERROR editing capsule ${capsuleId}: ${err}`);
          res.sendStatus(504);
        } else {
          console.log(`Capsule ${capsuleId} successfully edited`);
          res.sendStatus(200);
        }
      });
    }
  });
};

exports.deleteCapsule = (req, res) => {
  Capsule.remove({ _id: req.body.capsuleId }, (err) => {
    if (err) {
      console.error(`Failed to remove capsule ${req.body.capsuleId} from the database`);
      res.sendStatus(504);
    } else {
      console.log(`Successfully removed capsule ${req.body.capsuleId} from the database`);
      res.sendStatus(204);
    }
  });
};

//this is the place to send recipients
exports.buryCapsule = (req, res) => {
  let capsuleId = req.body.capsuleId;
  let unearthDate = req.body.unearthDate;
  let newRecipient = req.body.recipient;


  Capsule.findOne({ _id: capsuleId })
    .populate('_user')
    .exec((err, capsule) => {
      if (err) {
        console.error(`ERROR: ${err}`);
        res.sendStatus(404);
      } else if (!capsule) {
        console.log(`Could not find capsule with id ${capsuleId}`);
        res.sendStatus(404);
      } else {
        capsule.buried = true;
        capsule.unearthDate = exports.parseDate(unearthDate);
        capsule.intendedRecipient = newRecipient;

        let year = capsule.unearthDate.getFullYear();
        let month = capsule.unearthDate.getMonth() + 1;
        let day = capsule.unearthDate.getDate();
        capsule.unearthMessage =
          `
          You may open this capsule on ${month}/${day}/${year}
          `;
        capsule.save((err) => {
          if (err) {
            console.error(`ERROR burying capsule ${capsuleId}: ${err}`);
            res.sendStatus(504);
          } else {
            console.log(`Capsule ${capsuleId} successfully buried`);
            res.sendStatus(200);
          }
        });
      }
    });
};

exports.checkSession = (req, res) => {
  if (req.session.user) {
    res.send(req.session.user);
  } else {
    res.send('no session found');
  }
};

exports.destroySession = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

exports.isLoggedOn = function(req, res, next) {
  console.log('cheking for user session every request:', req.session);
  if (req.session.user) {
    next();
  } else {
    res.redirect('/');
  }
}
